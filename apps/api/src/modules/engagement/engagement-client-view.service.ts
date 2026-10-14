import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@mjn/database';
import { findConsultantContact } from '../../common/consultant-contact';
import { docMatches, requirementState } from '../../common/doc-match';

export type ClientTask =
  | { key: 'letter' }
  | { key: 'replace'; docType: string; reason: string | null }
  | { key: 'form'; docType: string; note: string | null }
  | { key: 'payment'; amount: number }
  | { key: 'upload'; docType: string };

/**
 * Everything the client's "My case" page shows, in one answer and with nothing internal in it:
 * no internal notes, no follow-up dates, no staff contact details beyond a name.
 */
@Injectable()
export class EngagementClientViewService {
  constructor(private readonly db: DatabaseService) {}

  async view(engagementId: string) {
    const engagement = await this.db.engagement.findUnique({
      where: { id: engagementId },
      select: {
        id: true, personId: true, status: true, consultantId: true, createdAt: true,
        letterSignedAt: true, letterUrl: true,
        officer: { select: { name: true } },
        milestones: { select: { id: true, label: true, completedAt: true }, orderBy: { createdAt: 'asc' } },
        orders: {
          select: {
            status: true, total: true, amountDueNow: true,
            installmentSchedules: { select: { amount: true, status: true } },
            manualPayments: { where: { status: 'CONFIRMED' }, select: { amountUsd: true } },
          },
        },
      },
    });
    if (!engagement) throw new NotFoundException('Engagement not found');

    const [progress, documents, submissions, notes, consultant] = await Promise.all([
      this.db.licensingProgress.findFirst({
        where: { engagementId },
        select: { currentStage: { select: { requiredDocs: true, pathway: { select: { country: true, regulatoryBody: true } } } } },
      }),
      this.db.document.findMany({
        where: { personId: engagement.personId },
        select: { id: true, type: true, status: true, origin: true, engagementId: true, rejectionReason: true, officerNote: true, uploadedAt: true },
        orderBy: { uploadedAt: 'desc' },
      }),
      this.db.applicationTracking.findMany({
        where: { engagementId },
        select: { id: true, portal: true, status: true, referenceNumber: true, submittedAt: true, createdAt: true, updatedAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      // Only what was meant for the client: sent directly, or approved by a consultant.
      this.db.caseNote.findMany({
        where: {
          engagementId,
          isInternal: false,
          OR: [{ requiresApproval: false }, { approvedAt: { not: null } }],
        },
        select: { id: true, content: true, createdAt: true, approvedAt: true, author: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      findConsultantContact(this.db, engagement.consultantId),
    ]);

    const closed = engagement.status === 'COMPLETED' || engagement.status === 'TERMINATED';
    const own = documents.filter((d) => d.origin === 'CLIENT_UPLOADED');
    const best = (type: string) => requirementState(own, type).status;

    // Stages
    const stages = engagement.milestones;
    const done = stages.filter((s) => s.completedAt).length;
    const currentIndex = stages.findIndex((s) => !s.completedAt);
    const current = currentIndex >= 0 ? stages[currentIndex] : null;
    const startedAt = current
      ? (currentIndex > 0 ? stages[currentIndex - 1].completedAt : null) ?? engagement.letterSignedAt ?? engagement.createdAt
      : null;

    const requirements = progress?.currentStage?.requiredDocs ?? [];
    const requiredDocs = requirements.map((type) => {
      const { status, doc } = requirementState(own, type);
      return { type, status, reason: status === 'REJECTED' ? doc?.rejectionReason ?? null : null };
    });

    // Money
    const num = (v: unknown) => Number(v ?? 0);
    let total = 0;
    let paid = 0;
    let due = 0;
    for (const o of engagement.orders) {
      // A cancelled order is neither owed nor part of what was agreed.
      if (o.status === 'CANCELLED') continue;
      total += num(o.total);
      const unpaidLater = o.installmentSchedules.filter((i) => i.status !== 'PAID').reduce((s, i) => s + num(i.amount), 0);
      const invoiced = o.installmentSchedules.filter((i) => i.status === 'INVOICED').reduce((s, i) => s + num(i.amount), 0);
      // Part of an unpaid order may have arrived by bank transfer or cash.
      const byHand = o.manualPayments.reduce((s, m) => s + num(m.amountUsd), 0);
      if (o.status === 'PAID') paid += num(o.total);
      else if (o.status === 'PARTIALLY_PAID') { paid += Math.max(0, num(o.total) - unpaidLater); due += invoiced; }
      else { paid += byHand; due += Math.max(0, (o.amountDueNow != null ? num(o.amountDueNow) : num(o.total)) - byHand); }
    }

    // What the client has to do, most blocking first.
    const tasks: ClientTask[] = [];
    if (!closed) {
      if (!engagement.letterSignedAt && engagement.letterUrl) tasks.push({ key: 'letter' });
      const seen = new Set<string>();
      for (const d of own) {
        if (d.status !== 'REJECTED') continue;
        // Shown under the stage requirement's name when it answers one, so the upload lands in the right place.
        const name = requirements.find((r) => docMatches(d.type, r)) ?? d.type;
        if (seen.has(name) || best(name) !== 'REJECTED') continue;
        seen.add(name);
        tasks.push({ key: 'replace', docType: name, reason: d.rejectionReason });
      }
      for (const d of documents) {
        if (d.origin === 'OFFICER_SENT' && d.status === 'PENDING_CLIENT' && d.engagementId === engagement.id) {
          tasks.push({ key: 'form', docType: d.type, note: d.officerNote });
        }
      }
      if (due > 0) tasks.push({ key: 'payment', amount: due });
      for (const r of requiredDocs) if (!r.status) tasks.push({ key: 'upload', docType: r.type });
    }

    return {
      id: engagement.id,
      status: engagement.status,
      createdAt: engagement.createdAt,
      letter: { signedAt: engagement.letterSignedAt, ready: !!engagement.letterUrl },
      pathway: progress?.currentStage?.pathway ?? null,
      stages,
      stage: { done, total: stages.length, current: current?.label ?? null, startedAt },
      requiredDocs,
      team: {
        consultant: consultant?.name ? { name: consultant.name } : null,
        officer: engagement.officer?.name ? { name: engagement.officer.name } : null,
      },
      documents: {
        verified: own.filter((d) => d.status === 'VERIFIED').length,
        pending: own.filter((d) => d.status === 'PENDING').length,
        rejected: own.filter((d) => d.status === 'REJECTED').length,
        total: own.length,
      },
      payments: { paid, total, due },
      tasks,
      submissions,
      // Newest first by when the update reached the client (an approved one counts from its approval).
      updates: notes
        .map((n) => ({ id: n.id, content: n.content, at: n.approvedAt ?? n.createdAt, authorName: n.author?.name ?? null }))
        .sort((a, b) => b.at.getTime() - a.at.getTime()),
    };
  }
}
