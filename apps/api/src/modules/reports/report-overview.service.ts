import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '@mjn/database';
import { PaymentAdminService, PaymentRow } from '../payment-admin/payment-admin.service';
import { EngagementOverviewService } from '../engagement/engagement-overview.service';
import { doualaDate, doualaToUtc } from '../../common/douala-time';

export const REPORT_PERIODS = ['this_month', 'last_month', 'last_3_months', 'last_12_months', 'this_year'] as const;
export type ReportPeriod = (typeof REPORT_PERIODS)[number];

/** The portal tells clients a support request is usually answered within one working day. */
const SUPPORT_TARGET_HOURS = 24;
const round = (n: number) => Math.round(n * 100) / 100;

/** Moves a calendar date by whole months, keeping the day where the month has it (31 Mar − 1 month = 28/29 Feb). */
function addMonths(date: string, months: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  return new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), Math.min(d, lastDay))).toISOString().slice(0, 10);
}

/**
 * The dates a period covers, and the equally long period before it to compare with.
 * Days are Douala days. `to` is the moment the period ends (now, for a period still running).
 */
export function reportRange(period: ReportPeriod, now = new Date()) {
  const today = doualaDate(now);
  const monthStart = `${today.slice(0, 7)}-01`;
  let from: Date; let to = now; let prevFrom: Date; let prevTo: Date;

  switch (period) {
    case 'this_month': {
      from = doualaToUtc(monthStart);
      prevFrom = doualaToUtc(addMonths(monthStart, -1));
      // The same number of days into last month, never running past its end.
      prevTo = new Date(Math.min(prevFrom.getTime() + (to.getTime() - from.getTime()), from.getTime()));
      break;
    }
    case 'last_month': {
      from = doualaToUtc(addMonths(monthStart, -1));
      to = doualaToUtc(monthStart);
      prevFrom = doualaToUtc(addMonths(monthStart, -2));
      prevTo = from;
      break;
    }
    case 'last_3_months':
    case 'last_12_months': {
      const months = period === 'last_3_months' ? 3 : 12;
      from = doualaToUtc(addMonths(today, -months));
      prevFrom = doualaToUtc(addMonths(today, -2 * months));
      prevTo = from;
      break;
    }
    case 'this_year': {
      from = doualaToUtc(`${today.slice(0, 4)}-01-01`);
      prevFrom = doualaToUtc(`${Number(today.slice(0, 4)) - 1}-01-01`);
      prevTo = new Date(prevFrom.getTime() + (to.getTime() - from.getTime()));
      break;
    }
    default:
      throw new BadRequestException('Unknown period.');
  }
  return { from, to, prevFrom, prevTo };
}

const within = (at: Date | null | undefined, from: Date, to: Date) => !!at && at >= from && at < to;

@Injectable()
export class ReportOverviewService {
  constructor(
    private readonly db: DatabaseService,
    private readonly payments: PaymentAdminService,
    private readonly caseload: EngagementOverviewService,
  ) {}

  /** Everything on the Reports page. Finance staff get the money section only. */
  async overview(period: ReportPeriod, moneyOnly: boolean, now = new Date()) {
    if (!REPORT_PERIODS.includes(period)) throw new BadRequestException('Unknown period.');
    const range = reportRange(period, now);
    const head = { period, from: range.from, to: range.to, prevFrom: range.prevFrom, prevTo: range.prevTo, generatedAt: now };
    const money = await this.money(range, now);
    if (moneyOnly) return { ...head, money };
    const [leads, cases, service] = await Promise.all([this.leads(range), this.cases(range), this.service(range, now)]);
    return { ...head, money, leads, cases, service };
  }

  // ── Money: counted exactly as the Payments page counts it ───────────────────

  private async money(range: ReturnType<typeof reportRange>, now: Date) {
    const rows = await this.payments.list();
    // Money that came in, on the day it was paid, less anything refunded on it since.
    const received = rows.filter((r) => r.paidAt && r.state !== 'cancelled');
    const net = (list: PaymentRow[]) => round(list.reduce((s, r) => s + r.amount - r.refund, 0));
    const inPeriod = received.filter((r) => within(r.paidAt, range.from, range.to));
    const before = received.filter((r) => within(r.paidAt, range.prevFrom, range.prevTo));

    const [orderRefunds, bookingRefunds] = await Promise.all([
      this.db.order.aggregate({ where: { refundedAt: { gte: range.from, lt: range.to } }, _sum: { refundAmount: true } }),
      this.db.consultationBooking.aggregate({ where: { refundedAt: { gte: range.from, lt: range.to }, slot: { isFree: false } }, _sum: { refundAmount: true } }),
    ]);

    // What the paid orders were for. Fully refunded orders are left out; tax is not part of a service's price.
    const orderIds = inPeriod.filter((r) => r.kind === 'order' && r.state !== 'refunded').map((r) => r.id);
    const lines = orderIds.length
      ? await this.db.orderLineItem.findMany({
          where: { orderId: { in: orderIds } },
          select: { priceCharged: true, serviceItem: { select: { category: { select: { name: true } } } } },
        })
      : [];
    const byCategory = new Map<string, number>();
    for (const line of lines as any[]) {
      const name = line.serviceItem?.category?.name ?? 'Other';
      byCategory.set(name, (byCategory.get(name) ?? 0) + Number(line.priceCharged));
    }

    // The last twelve calendar months, whatever period is chosen.
    const thisMonth = `${doualaDate(now).slice(0, 7)}-01`;
    const monthly = Array.from({ length: 12 }, (_, i) => {
      const start = addMonths(thisMonth, i - 11);
      const from = doualaToUtc(start);
      const to = doualaToUtc(addMonths(start, 1));
      return { month: start.slice(0, 7), received: net(received.filter((r) => within(r.paidAt, from, to))) };
    });

    const waiting = rows.filter((r) => r.state === 'waiting' || r.state === 'checking' || r.state === 'to_confirm');
    return {
      received: net(inPeriod),
      receivedBefore: net(before),
      orders: net(inPeriod.filter((r) => r.kind === 'order')),
      consultations: net(inPeriod.filter((r) => r.kind === 'consultation')),
      payments: inPeriod.length,
      refunded: round(Number(orderRefunds._sum.refundAmount ?? 0) + Number(bookingRefunds._sum.refundAmount ?? 0)),
      waitingNow: round(waiting.reduce((s, r) => s + r.amount, 0)),
      waitingCount: waiting.length,
      byCategory: [...byCategory.entries()].map(([name, amount]) => ({ name, amount: round(amount) })).sort((a, b) => b.amount - a.amount),
      monthly,
    };
  }

  // ── Leads: where the people who arrived in the period have got to ───────────

  private async leads(range: ReturnType<typeof reportRange>) {
    const [leads, before] = await Promise.all([
      this.db.lead.findMany({
        where: { createdAt: { gte: range.from, lt: range.to } },
        select: { status: true, sourceBookingId: true, bookings: { select: { status: true, noShowAt: true } } },
      }),
      this.db.lead.count({ where: { createdAt: { gte: range.prevFrom, lt: range.prevTo } } }),
    ]);
    const booked = leads.filter((l) => l.bookings.length > 0 || !!l.sourceBookingId || ['FREE_CONSULT_BOOKED', 'FREE_CONSULT_DONE'].includes(l.status));
    const held = leads.filter((l) => l.status === 'FREE_CONSULT_DONE' || l.bookings.some((b) => b.status === 'COMPLETED'));
    const converted = leads.filter((l) => l.status === 'CONVERTED');
    return {
      arrived: leads.length,
      arrivedBefore: before,
      booked: booked.length,
      held: held.length,
      missed: leads.filter((l) => l.bookings.some((b) => !!b.noShowAt)).length,
      converted: converted.length,
      lost: leads.filter((l) => l.status === 'LOST').length,
      conversionRate: leads.length ? Math.round((converted.length / leads.length) * 100) : null,
    };
  }

  // ── Cases ───────────────────────────────────────────────────────────────────

  private async cases(range: ReturnType<typeof reportRange>) {
    const [started, startedBefore, completed, byStatus, board] = await Promise.all([
      this.db.engagement.count({ where: { createdAt: { gte: range.from, lt: range.to } } }),
      this.db.engagement.count({ where: { createdAt: { gte: range.prevFrom, lt: range.prevTo } } }),
      // No completion date is stored, so a completed case is dated by when it last changed.
      this.db.engagement.count({ where: { status: 'COMPLETED', updatedAt: { gte: range.from, lt: range.to } } }),
      this.db.engagement.groupBy({ by: ['status'], _count: { _all: true } }),
      // The same list, stage names and "quiet" rule the Caseload page uses.
      this.caseload.overview({ view: 'board' } as any, null),
    ]);
    const now: Record<string, number> = {};
    for (const g of byStatus as any[]) now[g.status] = g._count._all;

    const active = (board.items as any[]).filter((c) => c.status === 'ACTIVE');
    const stages = new Map<string, number>();
    for (const c of active) {
      const name = c.stage?.current ?? (c.stage?.total ? 'All stages done' : 'No pathway set');
      stages.set(name, (stages.get(name) ?? 0) + 1);
    }
    const progress = active.length
      ? await this.db.licensingProgress.findMany({
          where: { engagementId: { in: active.map((c) => c.id) } },
          select: { engagementId: true, currentStage: { select: { pathway: { select: { country: true } } } } },
        })
      : [];
    const countryOf = new Map<string, string>();
    for (const p of progress as any[]) countryOf.set(p.engagementId, p.currentStage?.pathway?.country ?? 'Not set');
    const destinations = new Map<string, number>();
    for (const c of active) {
      const country = countryOf.get(c.id) ?? 'Not set';
      destinations.set(country, (destinations.get(country) ?? 0) + 1);
    }
    const ranked = (m: Map<string, number>) => [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    return {
      started,
      startedBefore,
      completed,
      now: {
        active: now.ACTIVE ?? 0,
        onHold: now.ON_HOLD ?? 0,
        awaitingSignature: now.PENDING_SIGNATURE ?? 0,
        completed: now.COMPLETED ?? 0,
        terminated: now.TERMINATED ?? 0,
      },
      quiet: active.filter((c) => c.quiet).length,
      byStage: ranked(stages),
      byDestination: ranked(destinations),
    };
  }

  // ── Service: are clients being looked after ─────────────────────────────────

  private async service(range: ReturnType<typeof reportRange>, now: Date) {
    const [checked, waiting, oldest, tickets, sessions] = await Promise.all([
      this.db.document.count({ where: { verifiedAt: { gte: range.from, lt: range.to }, status: { in: ['VERIFIED', 'REJECTED'] } } }),
      this.db.document.count({ where: { status: 'PENDING' } }),
      this.db.document.findFirst({ where: { status: 'PENDING' }, orderBy: { uploadedAt: 'asc' }, select: { uploadedAt: true } }),
      this.db.supportTicket.findMany({
        where: { createdAt: { gte: range.from, lt: range.to } },
        select: { createdAt: true, replies: { where: { internal: false }, select: { authorRole: true, createdAt: true } } },
      }),
      this.db.consultationBooking.groupBy({
        by: ['status'],
        where: { slot: { startAt: { gte: range.from, lt: range.to }, isFree: false }, status: { in: ['COMPLETED', 'NO_SHOW'] } },
        _count: { _all: true },
      }),
    ]);

    // A request counts once it has been answered, or once the target time has passed without an answer.
    const target = SUPPORT_TARGET_HOURS * 3600000;
    let due = 0; let onTime = 0;
    for (const t of tickets) {
      const first = t.replies.filter((r) => r.authorRole !== 'CLIENT').sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
      if (!first && now.getTime() - t.createdAt.getTime() < target) continue;
      due++;
      if (first && first.createdAt.getTime() - t.createdAt.getTime() <= target) onTime++;
    }
    const count = (status: string) => (sessions as any[]).find((s) => s.status === status)?._count._all ?? 0;

    return {
      documentsChecked: checked,
      documentsWaiting: waiting,
      oldestWaitingSince: oldest?.uploadedAt ?? null,
      supportRequests: tickets.length,
      supportAnsweredOnTime: due ? Math.round((onTime / due) * 100) : null,
      supportTargetHours: SUPPORT_TARGET_HOURS,
      sessionsHeld: count('COMPLETED'),
      sessionsMissed: count('NO_SHOW'),
    };
  }
}

