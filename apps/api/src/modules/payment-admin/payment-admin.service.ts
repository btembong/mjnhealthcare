import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '@mjn/database';
import { OrderService } from '../order/order.service';
import { ConsultationService } from '../consultation/consultation.service';
import { paymentVerifier, belongsTo, providerOfRef, PaymentLookupError } from '../../common/payment-verifier';

export type PaymentKind = 'order' | 'consultation';
/**
 * Where a payment stands, in the words the Payments page uses:
 * waiting = nothing paid yet · checking = the client started paying a while ago and we never heard back ·
 * paid · part_refunded · refunded · cancelled (never paid).
 */
export type PaymentState = 'waiting' | 'checking' | 'paid' | 'part_refunded' | 'refunded' | 'cancelled';

export interface PaymentRow {
  id: string;
  kind: PaymentKind;
  state: PaymentState;
  status: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  personId: string | null;
  amount: number;
  refund: number;
  summary: string;
  createdAt: Date;
  startedAt: Date | null;
  paidAt: Date | null;
  attempts: { provider: string; ref: string; at: Date }[];
}

type Filters = { search?: string; kind?: string; state?: string; dateFrom?: string; dateTo?: string };
type Actor = { id: string };

/** A started payment with no answer after this long needs a person to look at it. */
const CHECK_AFTER_MINUTES = 15;
const PAID_BOOKING = ['CONFIRMED', 'COMPLETED', 'NO_SHOW'];

const round = (n: number) => Math.round(n * 100) / 100;
const providerOf = providerOfRef;

@Injectable()
export class PaymentAdminService {
  private readonly logger = new Logger(PaymentAdminService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly events: EventEmitter2,
    private readonly orders: OrderService,
    private readonly consultations: ConsultationService,
  ) {}

  // ── Reading ─────────────────────────────────────────────────────────────────

  async list(filters: Filters = {}): Promise<PaymentRow[]> {
    const { search, kind, state, dateFrom, dateTo } = filters;
    const q = search?.trim();
    const created = dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59.999Z`) } : {}),
          },
        }
      : {};

    const [bookings, orders] = await Promise.all([
      kind && kind !== 'consultation' ? [] : this.db.consultationBooking.findMany({
        where: {
          ...created,
          slot: { isFree: false }, // free consultations are not payments
          ...(q ? {
            OR: [
              { clientName: { contains: q, mode: 'insensitive' } },
              { clientEmail: { contains: q, mode: 'insensitive' } },
              { paymentRef: { contains: q, mode: 'insensitive' } },
              { id: { contains: q, mode: 'insensitive' } },
              { clientPhone: { contains: q } },
            ],
          } : {}),
        },
        include: { slot: { select: { startAt: true } }, consultant: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      kind && kind !== 'order' ? [] : this.db.order.findMany({
        where: {
          ...created,
          ...(q ? {
            OR: [
              { id: { contains: q, mode: 'insensitive' } },
              { person: { name: { contains: q, mode: 'insensitive' } } },
              { person: { email: { contains: q, mode: 'insensitive' } } },
              { engagement: { person: { name: { contains: q, mode: 'insensitive' } } } },
              { engagement: { person: { email: { contains: q, mode: 'insensitive' } } } },
              { paymentAttempts: { some: { providerRef: { contains: q, mode: 'insensitive' } } } },
            ],
          } : {}),
        },
        include: this.orderInclude,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const now = Date.now();
    const rows = [
      ...(bookings as any[]).map((b) => this.bookingRow(b, now)),
      ...(orders as any[]).map((o) => this.orderRow(o, now)),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    // Several states can be asked for at once ("paid,part_refunded").
    const wanted = (state ?? '').split(',').filter(Boolean);
    return wanted.length ? rows.filter((r) => wanted.includes(r.state)) : rows;
  }

  /** Headline numbers. Money received is counted on the day it was paid, less anything refunded. */
  async summary() {
    const rows = await this.list();
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const net = (r: PaymentRow) => r.amount - r.refund;
    const received = rows.filter((r) => r.paidAt && r.state !== 'cancelled');
    const waiting = rows.filter((r) => r.state === 'waiting' || r.state === 'checking');
    return {
      receivedThisMonth: round(received.filter((r) => r.paidAt! >= monthStart).reduce((s, r) => s + net(r), 0)),
      // The dashboard's "Revenue MTD" tile reads this name.
      revenueMtd: round(received.filter((r) => r.paidAt! >= monthStart).reduce((s, r) => s + net(r), 0)),
      receivedTotal: round(received.reduce((s, r) => s + net(r), 0)),
      waitingTotal: round(waiting.reduce((s, r) => s + r.amount, 0)),
      waitingCount: waiting.length,
      checkingCount: rows.filter((r) => r.state === 'checking').length,
      refundedTotal: round(rows.reduce((s, r) => s + r.refund, 0)),
    };
  }

  /** One payment in full: what it is for, every attempt, the receipt, and who did what to it. */
  async detail(kind: PaymentKind, id: string) {
    const now = Date.now();
    let row: PaymentRow;
    let lines: { name: string; price: number }[] = [];
    let extra: Record<string, unknown> = {};

    if (kind === 'order') {
      const order: any = await this.db.order.findUnique({ where: { id }, include: this.orderInclude });
      if (!order) throw new NotFoundException('That order no longer exists.');
      row = this.orderRow(order, now);
      lines = order.lineItems.map((li: any) => ({
        name: `${li.serviceItem?.name ?? 'Service'}${li.variant?.variantKey ? ` (${li.variant.variantKey})` : ''}`,
        price: Number(li.priceCharged),
      }));
      extra = {
        subtotal: Number(order.subtotal),
        taxAmount: Number(order.taxAmount),
        receiptIssuedAt: order.receipts[0]?.issuedAt ?? null,
        cancelReason: order.cancelReason ?? null,
        refundReason: order.refundReason ?? null,
        refundedAt: order.refundedAt ?? null,
        engagementId: order.engagementId ?? null,
        forStage: !!order.stageId,
      };
    } else {
      const booking: any = await this.db.consultationBooking.findUnique({
        where: { id },
        include: { slot: { select: { startAt: true, durationMinutes: true, isFree: true } }, consultant: { select: { name: true } } },
      });
      if (!booking) throw new NotFoundException('That booking no longer exists.');
      row = this.bookingRow(booking, now);
      extra = {
        consultantName: booking.consultant?.name ?? null,
        sessionStart: booking.slot?.startAt ?? null,
        refundedAt: booking.refundedAt ?? null,
        hasRoom: !!booking.dailyRoomUrl,
      };
    }

    const logs = await this.db.auditLog.findMany({
      where: { resourceType: kind === 'order' ? 'Order' : 'ConsultationBooking', resourceId: id, action: { startsWith: 'payment.' } },
      orderBy: { createdAt: 'desc' },
    });
    const actorIds = [...new Set(logs.map((l) => l.actorId))];
    const actors = actorIds.length ? await this.db.person.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true } }) : [];
    const nameOf = new Map(actors.map((a) => [a.id, a.name]));

    return {
      ...row,
      lines,
      ...extra,
      history: logs.map((l) => {
        const m = (l.metadata ?? {}) as Record<string, any>;
        return { at: l.createdAt, by: nameOf.get(l.actorId) ?? 'Staff', action: l.action.replace('payment.', ''), note: m.note ?? m.reason ?? null, amount: m.amount ?? null, method: m.method ?? null };
      }),
    };
  }

  // ── Checking with the payment provider ──────────────────────────────────────

  /** Asks Tranzak or Stripe what happened to a payment the client started. Changes nothing. */
  async check(kind: PaymentKind, id: string, ref?: string) {
    const row = await this.rowOf(kind, id);
    const attempt = ref ? row.attempts.find((a) => a.ref === ref) : row.attempts[0];
    if (!attempt) throw new BadRequestException('The client has not started a payment for this, so there is nothing to check.');
    const result = await this.ask(attempt.ref, id);
    return { ref: attempt.ref, provider: result.provider, status: result.status, paid: result.paid, amount: result.amount, currency: result.currency, checkedAt: new Date() };
  }

  /** One lookup with the provider. "Paid" also requires the provider's record to be for this order or booking. */
  private async ask(ref: string, id: string) {
    try {
      const verified = await paymentVerifier.verify(ref);
      return { ...verified, paid: verified.paid && belongsTo(verified, id) };
    } catch (err) {
      if (err instanceof PaymentLookupError) throw new BadRequestException(err.message);
      throw err;
    }
  }

  // ── Recording a payment ─────────────────────────────────────────────────────

  /**
   * Marks something as paid and runs everything a normal payment runs: receipt and email for an
   * order, video room and reminders for a consultation.
   *
   * Two ways in: `ref` = "Tranzak says this attempt succeeded" (checked again here, never taken on
   * trust), or `note` = the money arrived another way and the admin says how.
   */
  async recordPaid(actor: Actor, kind: PaymentKind, id: string, input: { ref?: string; note?: string }) {
    const row = await this.rowOf(kind, id);
    const note = (input?.note ?? '').trim();
    let via = 'manual';

    if (input?.ref) {
      const attempt = row.attempts.find((a) => a.ref === input.ref);
      if (!attempt) throw new BadRequestException('That payment attempt does not belong here.');
      const result = await this.ask(attempt.ref, id);
      const name = result.provider === 'stripe' ? 'Stripe' : 'Tranzak';
      if (!result.paid) throw new BadRequestException(`${name} does not show this as paid (it says ${result.status ?? 'nothing'}).`);
      via = result.provider;
    } else if (note.length < 5) {
      throw new BadRequestException('Say how the money was received (for example: bank transfer on 12 October, reference …).');
    }

    if (kind === 'order') {
      // A payment can land after the client cancelled an unpaid order; it still counts.
      const cancelledUnpaid = row.state === 'cancelled';
      if (!['waiting', 'checking'].includes(row.state) && !(cancelledUnpaid && via !== 'manual')) {
        throw new BadRequestException(row.state === 'paid' ? 'This order is already paid.' : 'This order is closed and cannot be marked as paid.');
      }
      await this.orders.markPaid(id);
    } else {
      if (row.status !== 'AWAITING_PAYMENT') {
        throw new BadRequestException(PAID_BOOKING.includes(row.status) ? 'This consultation is already paid.' : 'This booking is closed and cannot be marked as paid.');
      }
      const booking = await this.db.consultationBooking.findUnique({ where: { id }, select: { slotId: true } });
      await this.consultations.handlePaymentConfirmed(id);
      // The time may have been released while the payment was unconfirmed; it is taken again now.
      if (booking?.slotId) {
        await this.db.consultationSlot.update({ where: { id: booking.slotId }, data: { status: 'BOOKED', reservedUntil: null, reservedBy: null } });
      }
    }

    await this.log(actor, kind, id, 'payment.recorded_paid', { via, note: note || null, ref: input?.ref ?? null, amount: row.amount });
    return {
      message: kind === 'order'
        ? 'Recorded as paid. The receipt has been created and emailed to the client.'
        : 'Recorded as paid. The client has been emailed their confirmation and join link.',
    };
  }

  // ── Cancelling ──────────────────────────────────────────────────────────────

  /** Cancels something unpaid, or a paid consultation (which records a full refund, as on the Sessions page). */
  async cancel(actor: Actor, kind: PaymentKind, id: string, reason: string) {
    const why = (reason ?? '').trim();
    if (why.length < 3) throw new BadRequestException('Give a reason. The client is told why.');
    const row = await this.rowOf(kind, id);

    if (kind === 'order') {
      if (!['waiting', 'checking'].includes(row.state)) {
        throw new BadRequestException(row.state === 'paid' || row.state === 'part_refunded'
          ? 'This order has been paid. Record a refund instead.'
          : 'This order is already closed.');
      }
      await this.db.order.update({ where: { id }, data: { status: 'CANCELLED', cancelReason: why } });
      this.events.emit('order.cancelled_by_staff', { orderId: id, reason: why });
      await this.log(actor, kind, id, 'payment.cancelled', { reason: why });
      return { message: 'Order cancelled. The client has been emailed.' };
    }

    if (row.status === 'CONFIRMED') {
      const { refundAmount } = await this.consultations.cancelByStaff(id, why);
      await this.log(actor, kind, id, 'payment.cancelled', { reason: why, amount: refundAmount });
      return { message: `Consultation cancelled. A refund of $${refundAmount.toFixed(2)} is recorded as owed to the client — return the money through Tranzak.` };
    }
    if (row.status !== 'AWAITING_PAYMENT') throw new BadRequestException('This booking is already closed.');

    const booking = await this.db.consultationBooking.findUnique({ where: { id }, select: { slotId: true, slot: { select: { startAt: true } } } });
    await this.db.$transaction([
      this.db.consultationBooking.update({ where: { id }, data: { status: 'CANCELLED' } }),
      // An unpaid booking's time goes back on offer, unless it has already passed.
      ...(booking && booking.slot.startAt.getTime() > Date.now()
        ? [this.db.consultationSlot.update({ where: { id: booking.slotId }, data: { status: 'AVAILABLE', reservedUntil: null, reservedBy: null } })]
        : []),
    ]);
    this.events.emit('consultation.cancelled', {
      bookingId: id,
      clientName: row.clientName,
      clientEmail: row.clientEmail,
      clientPhone: row.clientPhone,
      refundAmount: 0,
      refundPercent: 0,
      reason: why,
      unpaid: true,
    });
    await this.log(actor, kind, id, 'payment.cancelled', { reason: why });
    return { message: 'Booking cancelled and its time is open again. The client has been emailed.' };
  }

  // ── Refunds ─────────────────────────────────────────────────────────────────

  /**
   * Records that money was returned on a paid order. This is a record only: the money itself is
   * sent back by hand through the payment provider. A full refund closes the order.
   */
  async recordRefund(actor: Actor, id: string, input: { amount: number; reason: string; method: string }) {
    const order: any = await this.db.order.findUnique({ where: { id }, select: { status: true, total: true, refundAmount: true, refundReason: true } });
    if (!order) throw new NotFoundException('That order no longer exists.');
    if (order.status !== 'PAID') throw new BadRequestException('Only a paid order can be refunded.');
    const reason = (input?.reason ?? '').trim();
    const method = (input?.method ?? '').trim();
    if (reason.length < 3) throw new BadRequestException('Give the reason for the refund. The client is told why.');
    if (method.length < 3) throw new BadRequestException('Say how the money was returned (for example: Tranzak refund to MTN MoMo).');
    const amount = round(Number(input?.amount));
    const total = Number(order.total);
    const before = Number(order.refundAmount ?? 0);
    const left = round(total - before);
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('Enter the amount refunded.');
    if (amount > left) throw new BadRequestException(`At most $${left.toFixed(2)} can still be refunded on this order.`);

    const refunded = round(before + amount);
    const full = refunded >= total;
    await this.db.order.update({
      where: { id },
      data: {
        refundAmount: refunded,
        refundedAt: new Date(),
        refundReason: order.refundReason ? `${order.refundReason}\n${reason}` : reason,
        ...(full ? { status: 'CANCELLED' } : {}),
      },
    });
    this.events.emit('order.refund_recorded', { orderId: id, amount, totalRefunded: refunded, full, reason, method });
    await this.log(actor, 'order', id, 'payment.refunded', { amount, reason, method });
    return { message: `Refund of $${amount.toFixed(2)} recorded. The client has been emailed.`, full };
  }

  // ── Export ──────────────────────────────────────────────────────────────────

  async exportCsv(filters: Filters): Promise<string> {
    const cell = (v: unknown) => {
      const text = String(v ?? '');
      // Quote everything, and stop a spreadsheet treating a value as a formula.
      return `"${(/^[=+\-@]/.test(text) ? `'${text}` : text).replace(/"/g, '""')}"`;
    };
    const label: Record<PaymentState, string> = {
      waiting: 'Waiting for payment', checking: 'Needs checking', paid: 'Paid', part_refunded: 'Part refunded', refunded: 'Refunded', cancelled: 'Cancelled',
    };
    const rows = await this.list(filters);
    const header = ['Date', 'Type', 'Client', 'Email', 'Phone', 'For', 'Amount USD', 'Refunded USD', 'Net USD', 'Status', 'Paid on', 'Payment reference', 'ID'];
    const body = rows.map((r) => [
      r.createdAt.toISOString().slice(0, 10),
      r.kind === 'order' ? 'Order' : 'Consultation',
      r.clientName, r.clientEmail, r.clientPhone ?? '', r.summary,
      r.amount.toFixed(2), r.refund.toFixed(2), (r.paidAt && r.state !== 'cancelled' ? r.amount - r.refund : 0).toFixed(2),
      label[r.state], r.paidAt ? r.paidAt.toISOString().slice(0, 10) : '', r.attempts[0]?.ref ?? '', r.id,
    ].map(cell).join(','));
    return [header.map(cell).join(','), ...body].join('\n');
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private readonly orderInclude = {
    person: { select: { id: true, name: true, email: true, phone: true } },
    engagement: { select: { person: { select: { id: true, name: true, email: true, phone: true } } } },
    lineItems: { select: { priceCharged: true, serviceItem: { select: { name: true } }, variant: { select: { variantKey: true } } } },
    paymentAttempts: { select: { provider: true, providerRef: true, createdAt: true }, orderBy: { createdAt: 'desc' as const } },
    receipts: { select: { issuedAt: true }, orderBy: { issuedAt: 'asc' as const }, take: 1 },
  };

  private async rowOf(kind: PaymentKind, id: string): Promise<PaymentRow> {
    if (kind === 'order') {
      const order = await this.db.order.findUnique({ where: { id }, include: this.orderInclude });
      if (!order) throw new NotFoundException('That order no longer exists.');
      return this.orderRow(order, Date.now());
    }
    const booking = await this.db.consultationBooking.findUnique({
      where: { id },
      include: { slot: { select: { startAt: true } }, consultant: { select: { name: true } } },
    });
    if (!booking) throw new NotFoundException('That booking no longer exists.');
    return this.bookingRow(booking, Date.now());
  }

  private stale(startedAt: Date | null, now: number) {
    return !!startedAt && now - startedAt.getTime() > CHECK_AFTER_MINUTES * 60000;
  }

  private orderRow(o: any, now: number): PaymentRow {
    const person = o.person ?? o.engagement?.person ?? null;
    const attempts = (o.paymentAttempts ?? [])
      .filter((a: any) => a.providerRef)
      .map((a: any) => ({ provider: a.provider, ref: a.providerRef, at: a.createdAt }));
    const startedAt: Date | null = attempts[0]?.at ?? null;
    const refund = Number(o.refundAmount ?? 0);
    const state: PaymentState =
      o.status === 'PAID' ? (refund > 0 ? 'part_refunded' : 'paid')
      : o.status === 'CANCELLED' ? (refund > 0 ? 'refunded' : 'cancelled')
      : this.stale(startedAt, now) ? 'checking' : 'waiting';
    const names: string[] = (o.lineItems ?? []).map((li: any) => li.serviceItem?.name ?? 'Service');
    return {
      id: o.id,
      kind: 'order',
      state,
      status: o.status,
      clientName: person?.name ?? 'Unknown client',
      clientEmail: person?.email ?? '',
      clientPhone: person?.phone ?? null,
      personId: person?.id ?? null,
      amount: Number(o.total ?? 0),
      refund,
      summary: names.length === 0 ? 'Order' : names.length === 1 ? names[0] : `${names[0]} +${names.length - 1}`,
      createdAt: o.createdAt,
      startedAt,
      // Refunded orders were paid first; cancelled ones never were.
      paidAt: o.paidAt ?? (o.status === 'PAID' || refund > 0 ? o.receipts?.[0]?.issuedAt ?? o.createdAt : null),
      attempts,
    };
  }

  private bookingRow(b: any, now: number): PaymentRow {
    const refund = Number(b.refundAmount ?? 0);
    const attempts = b.paymentRef ? [{ provider: providerOf(b.paymentRef), ref: b.paymentRef as string, at: b.createdAt as Date }] : [];
    const paid = PAID_BOOKING.includes(b.status);
    const state: PaymentState =
      paid ? (refund > 0 ? 'part_refunded' : 'paid')
      : b.status === 'CANCELLED' ? (refund > 0 ? 'refunded' : 'cancelled')
      : this.stale(attempts[0]?.at ?? null, now) ? 'checking' : 'waiting';
    return {
      id: b.id,
      kind: 'consultation',
      state,
      status: b.status,
      clientName: b.clientName ?? 'Unknown client',
      clientEmail: b.clientEmail ?? '',
      clientPhone: b.clientPhone ?? null,
      personId: null,
      amount: Number(b.amountPaid ?? 0),
      refund,
      summary: `Consultation${b.consultant?.name ? ` with ${b.consultant.name}` : ''}`,
      createdAt: b.createdAt,
      startedAt: attempts[0]?.at ?? null,
      // Bookings do not store a payment date; the booking is made and paid in one sitting.
      paidAt: paid || refund > 0 ? b.createdAt : null,
      attempts,
    };
  }

  private log(actor: Actor, kind: PaymentKind, id: string, action: string, metadata: Record<string, unknown>) {
    return this.db.auditLog.create({
      data: { actorId: actor.id, action, resourceType: kind === 'order' ? 'Order' : 'ConsultationBooking', resourceId: id, metadata: metadata as any },
    });
  }
}
