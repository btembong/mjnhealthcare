import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@mjn/database';
import { ConsultantScope } from '../auth/access.service';

// Days without any recorded activity before a case is flagged as quiet.
const QUIET_AFTER_DAYS: Record<string, number> = { ACTIVE: 14, PENDING_SIGNATURE: 5 };
const OPEN_STATUSES = ['PENDING_SIGNATURE', 'ACTIVE'];
const CLOSED_STATUSES = ['COMPLETED', 'TERMINATED'];
const LANE_ORDER: Record<string, number> = { us: 0, client: 1, progress: 2, hold: 3, closed: 4 };

export type CaseNeed = { key: string; label: string; side: 'us' | 'client' };
export type CaseLane = 'us' | 'client' | 'progress' | 'hold' | 'closed';

export type CaseSummary = {
  id: string;
  personId: string;
  status: string;
  createdAt: Date;
  person: { id: string; name: string | null; email: string | null; profession: string | null } | null;
  consultantId: string | null;
  consultantName: string | null;
  officerId: string | null;
  officerName: string | null;
  letterSignedAt: Date | null;
  stage: { done: number; total: number; current: string | null };
  needs: CaseNeed[];
  lane: CaseLane;
  quiet: boolean;
  lastActivityAt: Date;
  paid: number;
  total: number;
  docs: { verified: number; pending: number; rejected: number; total: number };
};

export type OverviewParams = {
  chip?: string;
  status?: string;
  consultant?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  view?: string;
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** One-line picture of each case: where it is, what it is waiting on, and when it last moved. */
@Injectable()
export class EngagementOverviewService {
  constructor(private readonly db: DatabaseService) {}

  private async summarise(where: { id?: string } = {}): Promise<CaseSummary[]> {
    const engagements = await this.db.engagement.findMany({
      where,
      select: {
        id: true,
        personId: true,
        status: true,
        consultantId: true,
        officerId: true,
        createdAt: true,
        letterSignedAt: true,
        person: { select: { id: true, name: true, email: true, profession: true } },
        officer: { select: { id: true, name: true } },
        milestones: { select: { label: true, completedAt: true, createdAt: true }, orderBy: { createdAt: 'asc' } },
        orders: { select: { status: true, total: true, createdAt: true } },
      },
    });
    if (engagements.length === 0) return [];

    const ids = engagements.map((e) => e.id);
    const personIds = [...new Set(engagements.map((e) => e.personId))];
    const consultantIds = [...new Set(engagements.map((e) => e.consultantId).filter(Boolean))] as string[];

    const [docGroups, docLatest, messageLatest, escalations, noteLatest, trackingLatest, profiles] = await Promise.all([
      this.db.document.groupBy({ by: ['personId', 'status'], where: { personId: { in: personIds } }, _count: { _all: true } }),
      this.db.document.groupBy({ by: ['personId'], where: { personId: { in: personIds } }, _max: { uploadedAt: true } }),
      this.db.engagementMessage.groupBy({
        by: ['engagementId', 'senderType'],
        where: { engagementId: { in: ids } },
        _max: { createdAt: true },
      }),
      this.db.caseEscalation.groupBy({
        by: ['engagementId'],
        where: { engagementId: { in: ids }, status: 'OPEN' },
        _count: { _all: true },
      }),
      this.db.caseNote.groupBy({ by: ['engagementId'], where: { engagementId: { in: ids } }, _max: { createdAt: true } }),
      this.db.applicationTracking.groupBy({ by: ['engagementId'], where: { engagementId: { in: ids } }, _max: { updatedAt: true } }),
      consultantIds.length
        ? this.db.consultantProfile.findMany({ where: { id: { in: consultantIds } }, select: { id: true, name: true } })
        : Promise.resolve([] as { id: string; name: string }[]),
    ]);

    const docsByPerson = new Map<string, { verified: number; pending: number; rejected: number; total: number }>();
    for (const g of docGroups) {
      const d = docsByPerson.get(g.personId) ?? { verified: 0, pending: 0, rejected: 0, total: 0 };
      const n = g._count._all;
      if (g.status === 'VERIFIED') d.verified += n;
      else if (g.status === 'PENDING') d.pending += n;
      else if (g.status === 'REJECTED') d.rejected += n;
      d.total += n;
      docsByPerson.set(g.personId, d);
    }
    const lastDoc = new Map(docLatest.map((g) => [g.personId, g._max.uploadedAt]));
    const lastClientMessage = new Map<string, Date>();
    const lastStaffMessage = new Map<string, Date>();
    for (const g of messageLatest) {
      const at = g._max.createdAt;
      if (!at) continue;
      const target = g.senderType === 'CLIENT' ? lastClientMessage : lastStaffMessage;
      const existing = target.get(g.engagementId);
      if (!existing || at > existing) target.set(g.engagementId, at);
    }
    const openEscalations = new Map(escalations.map((g) => [g.engagementId, g._count._all]));
    const lastNote = new Map(noteLatest.map((g) => [g.engagementId, g._max.createdAt]));
    const lastTracking = new Map(trackingLatest.map((g) => [g.engagementId, g._max.updatedAt]));
    const consultantName = new Map(profiles.map((p) => [p.id, p.name]));

    return engagements.map((e) => {
      const docs = docsByPerson.get(e.personId) ?? { verified: 0, pending: 0, rejected: 0, total: 0 };
      const done = e.milestones.filter((m) => m.completedAt).length;
      const current = e.milestones.find((m) => !m.completedAt)?.label ?? null;

      const paid = e.orders.filter((o) => o.status === 'PAID').reduce((s, o) => s + Number(o.total ?? 0), 0);
      const total = e.orders.reduce((s, o) => s + Number(o.total ?? 0), 0);
      const pendingSum = e.orders.filter((o) => o.status === 'PENDING').reduce((s, o) => s + Number(o.total ?? 0), 0);
      const partPaid = e.orders.some((o) => o.status === 'PARTIALLY_PAID');

      const clientMsg = lastClientMessage.get(e.id);
      const staffMsg = lastStaffMessage.get(e.id);
      const awaitingReply = !!clientMsg && (!staffMsg || clientMsg > staffMsg);

      const closed = CLOSED_STATUSES.includes(e.status);
      const needs: CaseNeed[] = [];
      if (!closed) {
        if (openEscalations.get(e.id)) needs.push({ key: 'escalation', label: 'Escalated', side: 'us' });
        if (awaitingReply) needs.push({ key: 'message', label: 'Message to answer', side: 'us' });
        if (docs.pending > 0) needs.push({ key: 'documents', label: `${plural(docs.pending, 'doc', 'docs')} to review`, side: 'us' });
        if (!e.consultantId) needs.push({ key: 'consultant', label: 'No consultant', side: 'us' });
        if (!e.letterSignedAt) needs.push({ key: 'letter', label: 'Letter not signed', side: 'client' });
        if (pendingSum > 0) needs.push({ key: 'payment', label: `Payment due $${pendingSum.toLocaleString('en-US')}`, side: 'client' });
        else if (partPaid) needs.push({ key: 'payment', label: 'Instalment due', side: 'client' });
        if (docs.rejected > 0) needs.push({ key: 'replace', label: `${plural(docs.rejected, 'doc', 'docs')} to replace`, side: 'client' });
      }

      const moments: (Date | null | undefined)[] = [
        e.createdAt, e.letterSignedAt, lastDoc.get(e.personId), clientMsg, staffMsg, lastNote.get(e.id), lastTracking.get(e.id),
        ...e.milestones.map((m) => m.completedAt ?? m.createdAt),
        ...e.orders.map((o) => o.createdAt),
      ];
      const lastActivityAt = moments.reduce<Date>((latest, m) => (m && m > latest ? m : latest), e.createdAt);
      const quietAfter = QUIET_AFTER_DAYS[e.status];
      const quiet = !!quietAfter && Date.now() - lastActivityAt.getTime() >= quietAfter * 86400000;

      const lane: CaseLane = closed ? 'closed'
        : e.status === 'ON_HOLD' ? 'hold'
        : needs.some((n) => n.side === 'us') ? 'us'
        : needs.some((n) => n.side === 'client') ? 'client'
        : 'progress';

      return {
        id: e.id,
        personId: e.personId,
        status: e.status,
        createdAt: e.createdAt,
        person: e.person,
        consultantId: e.consultantId || null,
        consultantName: e.consultantId ? consultantName.get(e.consultantId) ?? null : null,
        officerId: e.officerId,
        officerName: e.officer?.name ?? null,
        letterSignedAt: e.letterSignedAt,
        stage: { done, total: e.milestones.length, current },
        needs,
        lane,
        quiet,
        lastActivityAt,
        paid,
        total,
        docs,
      };
    });
  }

  async summary(engagementId: string): Promise<CaseSummary> {
    const [one] = await this.summarise({ id: engagementId });
    if (!one) throw new NotFoundException('Engagement not found');
    return one;
  }

  async overview(params: OverviewParams, scope: ConsultantScope | null) {
    let all = await this.summarise();
    if (scope) all = all.filter((c) => scope.canSeeEngagement(c));

    const needsAttention = (c: CaseSummary) => OPEN_STATUSES.includes(c.status) && (c.needs.length > 0 || c.quiet);
    const counts = {
      all: all.length,
      attention: all.filter(needsAttention).length,
      unassigned: all.filter((c) => !c.consultantId && !CLOSED_STATUSES.includes(c.status)).length,
      signature: all.filter((c) => c.status === 'PENDING_SIGNATURE').length,
      hold: all.filter((c) => c.status === 'ON_HOLD').length,
    };
    const consultants = [...new Map(all.filter((c) => c.consultantId).map((c) => [c.consultantId as string, c.consultantName ?? 'Unnamed consultant'])).entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));

    let items = all;
    switch (params.chip) {
      case 'attention': items = items.filter(needsAttention); break;
      case 'unassigned': items = items.filter((c) => !c.consultantId && !CLOSED_STATUSES.includes(c.status)); break;
      case 'signature': items = items.filter((c) => c.status === 'PENDING_SIGNATURE'); break;
      case 'hold': items = items.filter((c) => c.status === 'ON_HOLD'); break;
      default: break;
    }
    if (params.status) items = items.filter((c) => c.status === params.status);
    if (params.consultant === 'UNASSIGNED') items = items.filter((c) => !c.consultantId);
    else if (params.consultant) items = items.filter((c) => c.consultantId === params.consultant);
    const q = (params.q ?? '').trim().toLowerCase();
    if (q) {
      items = items.filter((c) =>
        (c.person?.name ?? '').toLowerCase().includes(q) ||
        (c.person?.email ?? '').toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q),
      );
    }

    // Work for the team first, then whatever has been quiet longest.
    items = [...items].sort(
      (a, b) => LANE_ORDER[a.lane] - LANE_ORDER[b.lane] || a.lastActivityAt.getTime() - b.lastActivityAt.getTime(),
    );

    if (params.view === 'board') {
      const open = items.filter((c) => c.lane !== 'closed').slice(0, 500);
      return { items: open, total: open.length, page: 1, pageSize: open.length, counts, consultants };
    }

    const pageSize = Math.min(100, Math.max(10, Math.floor(Number(params.pageSize) || 25)));
    const pages = Math.max(1, Math.ceil(items.length / pageSize));
    const page = Math.min(pages, Math.max(1, Math.floor(Number(params.page) || 1)));
    return {
      items: items.slice((page - 1) * pageSize, page * pageSize),
      total: items.length,
      page,
      pageSize,
      counts,
      consultants,
    };
  }
}
