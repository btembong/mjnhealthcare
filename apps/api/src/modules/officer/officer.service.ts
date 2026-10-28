import {
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AccessService } from '../auth/access.service';
import { AuthUser, isConsultant, isOfficer } from '../auth/access';
import { EngagementOverviewService, CaseSummary } from '../engagement/engagement-overview.service';
import { DatabaseService } from '@mjn/database';
import { EventEmitter2 } from '@nestjs/event-emitter';

const OPEN_CASE = ['PENDING_SIGNATURE', 'ACTIVE', 'ON_HOLD'];
// A submission in one of these states needs no more follow-up.
const SUBMISSION_DONE = ['APPROVED', 'REJECTED'];
// How long a declined client update stays on the officer's list if they do nothing about it.
const DECLINED_SHOWN_DAYS = 14;
const DAY = 86400000;

export type OfficerNeed = {
  key: 'followup' | 'form' | 'declined';
  label: string;
  text: string;
  at: Date;
  trackingId?: string;
  documentId?: string;
  noteId?: string;
};

export type OfficerCase = {
  id: string;
  status: string;
  person: CaseSummary['person'];
  stage: CaseSummary['stage'];
  consultantName: string | null;
  submission: { id: string; portal: string; status: string; referenceNumber: string | null } | null;
  submissionCount: number;
  nextFollowUp: { trackingId: string; portal: string; date: Date } | null;
  followUpDue: boolean;
  upcoming: { trackingId: string; portal: string; date: Date }[];
  needs: OfficerNeed[];
  waiting: { approvals: number; escalations: number; forms: number };
  quiet: boolean;
  lastActivityAt: Date;
  paid: number;
  total: number;
  docs: CaseSummary['docs'];
};

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function dueText(portal: string, date: Date) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const days = Math.floor((start.getTime() - new Date(date).setHours(0, 0, 0, 0)) / DAY);
  if (days <= 0) return `${portal} follow-up is due today`;
  if (days === 1) return `${portal} follow-up was due yesterday`;
  return `${portal} follow-up was due ${days} days ago`;
}

@Injectable()
export class OfficerService {
  constructor(
    private readonly db: DatabaseService,
    private readonly events: EventEmitter2,
    private readonly access: AccessService,
    private readonly overview: EngagementOverviewService,
  ) {}

  // ── Admin: create / list officers ─────────────────────────────────────────

  private async assertEmailFree(email: string, exceptId?: string) {
    const existing = await this.db.person.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existing && existing.id !== exceptId) {
      throw new ConflictException('An account with this email address already exists.');
    }
  }

  async createOfficer(data: {
    name: string;
    email: string;
    password: string;
  }) {
    await this.assertEmailFree(data.email);
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash(data.password, 12);
    return this.db.person.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: hash,
        role: 'PROCESSING_OFFICER',
        isActive: true,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
  }

  async listOfficers() {
    return this.db.person.findMany({
      where: { role: 'PROCESSING_OFFICER' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isAvailable: true,
        createdAt: true,
        officerEngagements: {
          select: { id: true, status: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async setOfficerAvailability(
    officerId: string,
    isAvailable: boolean,
    reassignToOfficerId?: string | null,
    keepCases = false,
  ) {
    const officer = await this.db.person.findUnique({ where: { id: officerId } });
    if (!officer || officer.role !== 'PROCESSING_OFFICER')
      throw new NotFoundException('Officer not found');

    await this.db.person.update({
      where: { id: officerId },
      data: { isAvailable },
    });

    if (!isAvailable && keepCases) {
      return { markedUnavailable: true, casesReassigned: 0, casesKept: true };
    }

    if (!isAvailable) {
      // Bulk reassign or unassign all active cases
      const cases = await this.db.engagement.findMany({
        where: { officerId, status: { in: ['ACTIVE', 'PENDING_SIGNATURE'] } },
        include: { person: { select: { name: true } } },
      });

      for (const eng of cases) {
        await this.db.engagement.update({
          where: { id: eng.id },
          data: { officerId: reassignToOfficerId ?? null },
        });

        if (reassignToOfficerId) {
          const newOfficer = await this.db.person.findUnique({
            where: { id: reassignToOfficerId },
            select: { name: true, email: true, phone: true },
          });
          if (newOfficer) {
            this.events.emit('officer.assigned', {
              engagementId: eng.id,
              officerId: reassignToOfficerId,
              officerEmail: newOfficer.email,
              officerName: newOfficer.name,
              officerPhone: (newOfficer as any).phone,
              clientName: eng.person?.name ?? 'a client',
            });
          }
        }
      }

      return { markedUnavailable: true, casesReassigned: cases.length };
    }

    return { markedUnavailable: false };
  }

  async updateOfficer(id: string, data: { name?: string; email?: string; notes?: string }) {
    if (data.email) await this.assertEmailFree(data.email, id);
    return this.db.person.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
      },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
  }

  async deactivateOfficer(id: string) {
    // Unassign all active cases first
    await this.db.engagement.updateMany({
      where: { officerId: id, status: { in: ['ACTIVE', 'PENDING_SIGNATURE'] } },
      data: { officerId: null },
    });
    return this.db.person.update({
      where: { id },
      data: { isActive: false, isAvailable: false },
      select: { id: true, name: true, isActive: true },
    });
  }

  async reactivateOfficer(id: string) {
    const officer = await this.db.person.findUnique({ where: { id }, select: { role: true } });
    if (!officer || officer.role !== 'PROCESSING_OFFICER') throw new NotFoundException('Officer not found');
    return this.db.person.update({
      where: { id },
      data: { isActive: true, isAvailable: true },
      select: { id: true, name: true, isActive: true, isAvailable: true },
    });
  }

  /** Moves several cases to one officer (or to none) with a single handover note. */
  async reassignCases(engagementIds: string[], officerId: string | null, handoverNotes?: string) {
    const ids = [...new Set(engagementIds)].slice(0, 200);
    let moved = 0;
    for (const engagementId of ids) {
      await this.assignOfficer(engagementId, officerId, handoverNotes);
      moved += 1;
    }
    return { moved };
  }

  // ── Admin: assign officer to engagement ───────────────────────────────────

  async assignOfficer(engagementId: string, officerId: string | null, handoverNotes?: string) {
    const engagement = await this.db.engagement.findUnique({
      where: { id: engagementId },
    });
    if (!engagement) throw new NotFoundException('Engagement not found');

    if (officerId) {
      const officer = await this.db.person.findUnique({ where: { id: officerId } });
      if (!officer || officer.role !== 'PROCESSING_OFFICER')
        throw new NotFoundException('Officer not found');
    }

    const updated = await this.db.engagement.update({
      where: { id: engagementId },
      data: { officerId, ...(handoverNotes !== undefined ? { handoverNotes } : {}) },
      include: {
        person: { select: { name: true } },
        officer: officerId ? { select: { id: true, name: true, email: true, phone: true } } : undefined,
      },
    });

    if (officerId && updated.officer) {
      this.events.emit('officer.assigned', {
        engagementId,
        officerId,
        officerEmail: updated.officer.email,
        officerName: updated.officer.name,
        officerPhone: (updated.officer as any).phone,
        clientName: updated.person?.name ?? 'a client',
      });
    }

    return { id: updated.id, officerId: updated.officerId };
  }

  // ── Officer: my assigned cases ────────────────────────────────────────────

  /**
   * One line per case assigned to this officer: its stage, latest submission, next follow-up,
   * and what is waiting on the officer. An item on the "needs" list clears once the officer
   * records something on that case (a note or a submission update) after it appeared.
   */
  private async officerCases(officerId: string, onlyEngagementId?: string): Promise<OfficerCase[]> {
    let summaries = await this.overview.forOfficer(officerId);
    if (onlyEngagementId) summaries = summaries.filter((c) => c.id === onlyEngagementId);
    if (summaries.length === 0) return [];
    const ids = summaries.map((c) => c.id);

    const [trackings, forms, notes, escalations] = await Promise.all([
      this.db.applicationTracking.findMany({ where: { engagementId: { in: ids } }, orderBy: { createdAt: 'desc' } }),
      this.db.document.findMany({
        // Forms still open; a document sent only for the client to keep needs nothing back.
        where: { engagementId: { in: ids }, origin: 'OFFICER_SENT', needsReturn: true, status: 'PENDING_CLIENT' },
        select: {
          id: true, type: true, engagementId: true,
          linkedReturns: { select: { id: true, uploadedAt: true, status: true }, orderBy: { uploadedAt: 'desc' } },
        },
      }),
      this.db.caseNote.findMany({
        where: { engagementId: { in: ids }, authorId: officerId },
        select: {
          id: true, engagementId: true, createdAt: true, isInternal: true,
          requiresApproval: true, approvedAt: true, rejectedAt: true, rejectionReason: true,
        },
      }),
      this.db.caseEscalation.groupBy({
        by: ['engagementId'],
        where: { engagementId: { in: ids }, officerId, status: 'OPEN' },
        _count: { _all: true },
      }),
    ]);

    const today = endOfToday();
    const weekOut = new Date(today.getTime() + 7 * DAY);
    const openEscalations = new Map(escalations.map((g) => [g.engagementId, g._count._all]));

    const cases = summaries.map((c): OfficerCase => {
      const mine = trackings.filter((t) => t.engagementId === c.id);
      const myNotes = notes.filter((n) => n.engagementId === c.id);
      const myForms = forms.filter((f) => f.engagementId === c.id);
      const closed = !OPEN_CASE.includes(c.status);

      const followUps = mine
        .filter((t) => t.nextActionDate && !SUBMISSION_DONE.includes(t.status))
        .map((t) => ({ trackingId: t.id, portal: t.portal, date: t.nextActionDate as Date }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      // The last time this officer recorded anything on the case.
      const lastActed = Math.max(
        0,
        ...myNotes.map((n) => n.createdAt.getTime()),
        ...mine.map((t) => t.updatedAt.getTime()),
      );

      const needs: OfficerNeed[] = [];
      if (!closed) {
        for (const f of followUps.filter((x) => x.date <= today)) {
          needs.push({ key: 'followup', label: 'Follow-up due', text: dueText(f.portal, f.date), at: f.date, trackingId: f.trackingId });
        }
        for (const form of myForms) {
          const returned = form.linkedReturns[0];
          if (returned && returned.uploadedAt.getTime() > lastActed) {
            needs.push({ key: 'form', label: 'Form returned', text: `The client returned ${form.type}`, at: returned.uploadedAt, documentId: returned.id });
          }
        }
        for (const n of myNotes) {
          if (!n.rejectedAt) continue;
          const recent = Date.now() - n.rejectedAt.getTime() < DECLINED_SHOWN_DAYS * DAY;
          const actedSince = myNotes.some((o) => o.id !== n.id && o.createdAt > (n.rejectedAt as Date));
          if (recent && !actedSince) {
            needs.push({
              key: 'declined',
              label: 'Update not approved',
              text: n.rejectionReason ? `Your client update was not approved: ${n.rejectionReason}` : 'Your client update was not approved',
              at: n.rejectedAt,
              noteId: n.id,
            });
          }
        }
      }

      const latest = mine[0] ?? null;
      return {
        id: c.id,
        status: c.status,
        person: c.person,
        stage: c.stage,
        consultantName: c.consultantName,
        submission: latest ? { id: latest.id, portal: latest.portal, status: latest.status, referenceNumber: latest.referenceNumber } : null,
        submissionCount: mine.length,
        nextFollowUp: followUps[0] ?? null,
        followUpDue: !closed && followUps.some((f) => f.date <= today),
        upcoming: closed ? [] : followUps.filter((f) => f.date > today && f.date <= weekOut),
        needs,
        waiting: {
          approvals: myNotes.filter((n) => !n.isInternal && n.requiresApproval && !n.approvedAt).length,
          escalations: openEscalations.get(c.id) ?? 0,
          forms: myForms.filter((f) => !f.linkedReturns[0] || f.linkedReturns[0].status === 'REJECTED').length,
        },
        quiet: c.quiet,
        lastActivityAt: c.lastActivityAt,
        paid: c.paid,
        total: c.total,
        docs: c.docs,
      };
    });

    // Cases that need the officer first, oldest need on top; then the ones that have been quiet longest.
    const firstNeed = (c: OfficerCase) => Math.min(...c.needs.map((n) => n.at.getTime()));
    return cases.sort((a, b) => {
      const open = Number(!OPEN_CASE.includes(a.status)) - Number(!OPEN_CASE.includes(b.status));
      if (open) return open;
      if (a.needs.length && b.needs.length) return firstNeed(a) - firstNeed(b);
      if (a.needs.length || b.needs.length) return b.needs.length ? 1 : -1;
      return a.lastActivityAt.getTime() - b.lastActivityAt.getTime();
    });
  }

  getMyCases(officerId: string) {
    return this.officerCases(officerId);
  }

  async getCaseById(engagementId: string, officerId: string) {
    const engagement = await this.db.engagement.findUnique({
      where: { id: engagementId },
      select: {
        id: true, status: true, consultantId: true, officerId: true, handoverNotes: true,
        letterSignedAt: true, createdAt: true,
        person: { select: { id: true, name: true, email: true, phone: true, profession: true, locale: true } },
        milestones: { orderBy: { createdAt: 'asc' } },
        officer: { select: { id: true, name: true, email: true } },
        caseNotes: {
          include: { author: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
        applicationTracking: { orderBy: { createdAt: 'desc' } },
        escalations: {
          include: { consultant: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!engagement) throw new NotFoundException('Engagement not found');
    if (engagement.officerId !== officerId)
      throw new ForbiddenException('Not assigned to this case');

    const [work] = await this.officerCases(officerId, engagementId);
    return { ...engagement, work: work ?? null };
  }

  // ── Case Notes ────────────────────────────────────────────────────────────

  async addCaseNote(
    engagementId: string,
    authorId: string,
    content: string,
    isInternal = true,
    requiresApproval = false,
  ) {
    const engagement = await this.db.engagement.findUnique({
      where: { id: engagementId },
    });
    if (!engagement) throw new NotFoundException('Engagement not found');

    const note = await this.db.caseNote.create({
      data: { engagementId, authorId, content, isInternal, requiresApproval },
      include: { author: { select: { id: true, name: true, role: true } } },
    });

    // Sent-to-client AND no approval needed → deliver immediately
    if (!isInternal && !requiresApproval) {
      const full = await this.db.engagement.findUnique({
        where: { id: engagementId },
        include: { person: { select: { id: true, name: true, email: true, phone: true } } },
      });
      if (full?.person) {
        await this.db.communicationLog.create({
          data: {
            personId: full.person.id,
            engagementId,
            sentById: authorId,
            channel: 'PORTAL',
            direction: 'OUTBOUND',
            content,
          },
        });
        this.events.emit('officer.client_update_sent', {
          engagementId,
          clientName: full.person.name ?? 'Client',
          clientEmail: full.person.email,
          clientPhone: full.person.phone,
          content,
          authorId,
        });
      }
    }

    // Sent-to-client AND requires approval → notify consultant to review
    if (!isInternal && requiresApproval) {
      const full = await this.db.engagement.findUnique({
        where: { id: engagementId },
        include: {
          person: { select: { id: true, name: true } },
        },
      });
      this.events.emit('officer.update_pending_approval', {
        noteId: note.id,
        engagementId,
        authorId,
        content,
        clientName: full?.person?.name ?? 'Client',
        consultantId: full?.consultantId,
      });
    }

    return note;
  }

  // ── Note approval ─────────────────────────────────────────────────────────

  async approveNote(noteId: string, approverId: string) {
    const note = await this.db.caseNote.findUnique({
      where: { id: noteId },
      include: {
        engagement: {
          include: { person: { select: { id: true, name: true, email: true, phone: true } } },
        },
        author: { select: { id: true, name: true } },
      },
    });
    if (!note) throw new NotFoundException('Note not found');
    if (note.approvedAt) return note; // already approved

    const approved = await this.db.caseNote.update({
      where: { id: noteId },
      data: { approvedAt: new Date(), approvedById: approverId },
      include: { author: { select: { id: true, name: true, role: true } } },
    });

    // Now deliver to client
    const person = note.engagement?.person;
    if (person) {
      await this.db.communicationLog.create({
        data: {
          personId: person.id,
          engagementId: note.engagementId,
          sentById: approverId,
          channel: 'PORTAL',
          direction: 'OUTBOUND',
          content: note.content,
        },
      });
      this.events.emit('officer.client_update_sent', {
        engagementId: note.engagementId,
        clientName: person.name ?? 'Client',
        clientEmail: person.email,
        clientPhone: (person as any).phone,
        content: note.content,
        authorId: note.authorId,
      });
    }

    return approved;
  }

  async rejectNote(noteId: string, reason?: string) {
    const note = await this.db.caseNote.findUnique({ where: { id: noteId } });
    if (!note) throw new NotFoundException('Note not found');
    if (note.approvedAt) throw new BadRequestException('This update was already approved and sent.');
    // Rejection: make fully internal so it never reaches the client, and keep why for the officer.
    return this.db.caseNote.update({
      where: { id: noteId },
      data: {
        isInternal: true,
        requiresApproval: false,
        rejectedAt: new Date(),
        rejectionReason: reason?.trim() || null,
      },
    });
  }

  /** The case a note belongs to, for access checks. */
  async noteEngagementId(noteId: string): Promise<string> {
    const note = await this.db.caseNote.findUnique({ where: { id: noteId }, select: { engagementId: true } });
    if (!note) throw new NotFoundException('Note not found');
    return note.engagementId;
  }

  /** Consultants see approvals for their own cases, officers the ones they wrote; other staff see all. */
  async getPendingApprovals(user: AuthUser) {
    const consultantIds = isConsultant(user) ? [...(await this.access.consultantIds(user))] : null;
    return this.db.caseNote.findMany({
      where: {
        isInternal: false,
        requiresApproval: true,
        approvedAt: null,
        ...(consultantIds ? { engagement: { consultantId: { in: consultantIds } } } : {}),
        ...(isOfficer(user) ? { authorId: user.id } : {}),
      },
      include: {
        author: { select: { id: true, name: true } },
        engagement: {
          include: { person: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Client-facing updates (approved + non-approval notes) ────────────────

  /** The officer's home screen: what to do first, what is coming, and what is with someone else. */
  async getMyWork(officerId: string) {
    const all = await this.officerCases(officerId);
    const cases = all.filter((c) => OPEN_CASE.includes(c.status));
    const ids = cases.map((c) => c.id);
    const name = (c: OfficerCase) => c.person?.name ?? 'Client';

    const order: Record<OfficerNeed['key'], number> = { followup: 0, form: 1, declined: 2 };
    const doFirst = cases
      .flatMap((c) => c.needs.map((n) => ({ ...n, engagementId: c.id, clientName: name(c) })))
      .sort((a, b) => order[a.key] - order[b.key] || a.at.getTime() - b.at.getTime());

    const comingUp = cases
      .flatMap((c) => c.upcoming.map((u) => ({ ...u, engagementId: c.id, clientName: name(c) })))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Monday starts the week.
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));

    const [escalations, statusGroups, weekNotes, weekClientUpdates, weekSubmissions] = await Promise.all([
      this.db.caseEscalation.findMany({
        where: { officerId, status: 'OPEN' },
        select: {
          id: true, engagementId: true, createdAt: true,
          consultant: { select: { name: true } },
          engagement: { select: { person: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.db.applicationTracking.groupBy({ by: ['status'], where: { engagementId: { in: ids } }, _count: { _all: true } }),
      this.db.caseNote.count({ where: { authorId: officerId, isInternal: true, rejectedAt: null, createdAt: { gte: weekStart } } }),
      this.db.caseNote.count({ where: { authorId: officerId, isInternal: false, createdAt: { gte: weekStart } } }),
      this.db.applicationTracking.count({ where: { engagement: { officerId }, createdAt: { gte: weekStart } } }),
    ]);

    return {
      counts: {
        openCases: cases.length,
        followUpsDue: doFirst.filter((n) => n.key === 'followup').length,
        formsReturned: doFirst.filter((n) => n.key === 'form').length,
        noSubmission: cases.filter((c) => c.status === 'ACTIVE' && c.submissionCount === 0).length,
        quiet: cases.filter((c) => c.quiet).length,
      },
      doFirst,
      comingUp,
      waiting: {
        approvals: cases.reduce((n, c) => n + c.waiting.approvals, 0),
        formsWithClient: cases.reduce((n, c) => n + c.waiting.forms, 0),
        escalations: escalations.map((e) => ({
          id: e.id,
          engagementId: e.engagementId,
          createdAt: e.createdAt,
          clientName: e.engagement?.person?.name ?? 'Client',
          consultantName: e.consultant?.name ?? null,
        })),
      },
      submissions: Object.fromEntries(statusGroups.map((g) => [g.status, g._count._all])),
      thisWeek: { submissions: weekSubmissions, notes: weekNotes, clientUpdates: weekClientUpdates },
    };
  }

  async getRecentOfficerNotes(user: AuthUser, limit = 20) {
    return this.db.caseNote.findMany({
      where: isOfficer(user) ? { authorId: user.id } : { author: { role: 'PROCESSING_OFFICER' } },
      include: {
        author: { select: { id: true, name: true } },
        engagement: { include: { person: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getClientUpdates(engagementId: string) {
    return this.db.caseNote.findMany({
      where: {
        engagementId,
        isInternal: false,
        OR: [
          { requiresApproval: false },
          { requiresApproval: true, approvedAt: { not: null } },
        ],
      },
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCaseNotes(engagementId: string) {
    return this.db.caseNote.findMany({
      where: { engagementId },
      include: { author: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Application Tracking ─────────────────────────────────────────────────

  async addTracking(
    engagementId: string,
    data: {
      portal: string;
      referenceNumber?: string;
      submittedAt?: string;
      status?: string;
      notes?: string;
      nextActionDate?: string;
    },
  ) {
    const engagement = await this.db.engagement.findUnique({
      where: { id: engagementId },
    });
    if (!engagement) throw new NotFoundException('Engagement not found');

    return this.db.applicationTracking.create({
      data: {
        engagementId,
        portal: data.portal,
        referenceNumber: data.referenceNumber,
        submittedAt: data.submittedAt ? new Date(data.submittedAt) : undefined,
        status: data.status ?? 'SUBMITTED',
        notes: data.notes,
        nextActionDate: data.nextActionDate
          ? new Date(data.nextActionDate)
          : undefined,
      },
    });
  }

  async updateTracking(
    engagementId: string,
    trackingId: string,
    data: {
      portal?: string;
      referenceNumber?: string;
      submittedAt?: string | null;
      status?: string;
      notes?: string;
      nextActionDate?: string | null;
    },
  ) {
    const record = await this.db.applicationTracking.findUnique({
      where: { id: trackingId },
    });
    if (!record || record.engagementId !== engagementId) throw new NotFoundException('Tracking record not found');

    // An empty date clears it; a missing one leaves it alone.
    const date = (value?: string | null) => (value === undefined ? undefined : value ? new Date(value) : null);

    return this.db.applicationTracking.update({
      where: { id: trackingId },
      data: {
        portal: data.portal || undefined,
        referenceNumber: data.referenceNumber,
        submittedAt: date(data.submittedAt),
        status: data.status || undefined,
        notes: data.notes,
        nextActionDate: date(data.nextActionDate),
      },
    });
  }

  async getTracking(engagementId: string) {
    return this.db.applicationTracking.findMany({
      where: { engagementId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Escalation ────────────────────────────────────────────────────────────

  async escalate(
    engagementId: string,
    officerId: string,
    requestedConsultantId: string | undefined,
    reason: string,
  ) {
    const engagement = await this.db.engagement.findUnique({
      where: { id: engagementId },
    });
    if (!engagement) throw new NotFoundException('Engagement not found');

    // The form sends a consultant profile id; the escalation is stored against that consultant's login.
    const target = requestedConsultantId || engagement.consultantId;
    if (!target) {
      throw new BadRequestException('This case has no consultant assigned. Choose a consultant to escalate to.');
    }
    const consultantId = await this.access.resolveConsultantLogin(target);
    if (!consultantId) {
      throw new BadRequestException(
        'That consultant has no staff login, so they cannot receive escalations. Choose another consultant, or ask an admin to create a login with the same email as their consultant profile.',
      );
    }

    const escalation = await this.db.caseEscalation.create({
      data: { engagementId, officerId, consultantId, reason, status: 'OPEN' },
    });

    this.events.emit('case.escalated', {
      escalationId: escalation.id,
      engagementId,
      officerId,
      consultantId,
      reason,
    });

    return escalation;
  }

  async getEscalations(officerId: string) {
    return this.db.caseEscalation.findMany({
      where: { officerId },
      include: {
        consultant: { select: { name: true } },
        engagement: { select: { person: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveEscalation(
    escalationId: string,
    resolution: string,
  ) {
    const escalation = await this.db.caseEscalation.findUnique({
      where: { id: escalationId },
    });
    if (!escalation) throw new NotFoundException('Escalation not found');

    const resolved = await this.db.caseEscalation.update({
      where: { id: escalationId },
      data: { status: 'RESOLVED', resolvedAt: new Date(), resolution },
      include: {
        officer: { select: { name: true, email: true, phone: true } },
        engagement: { include: { person: { select: { name: true } } } },
      },
    });

    this.events.emit('case.escalation_resolved', {
      escalationId,
      officerEmail: resolved.officer?.email,
      officerName: resolved.officer?.name,
      officerPhone: (resolved.officer as any)?.phone,
      clientName: resolved.engagement?.person?.name ?? 'a client',
      resolution,
    });

    return resolved;
  }

  // ── Consultant: escalation inbox ─────────────────────────────────────────

  async getConsultantEscalations(consultantId: string) {
    return this.db.caseEscalation.findMany({
      where: { consultantId },
      include: {
        engagement: {
          include: {
            person: { select: { id: true, name: true, email: true } },
          },
        },
        officer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Shared: officer activity feed (for consultant view) ───────────────────

  async getOfficerActivity(engagementId: string) {
    const [notes, tracking, escalations] = await Promise.all([
      this.db.caseNote.findMany({
        where: { engagementId },
        include: { author: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.db.applicationTracking.findMany({
        where: { engagementId },
        orderBy: { createdAt: 'desc' },
      }),
      this.db.caseEscalation.findMany({
        where: { engagementId },
        include: {
          officer: { select: { name: true } },
          consultant: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Merge into unified timeline
    const timeline = [
      ...notes.map((n) => ({ type: 'note' as const, ts: n.createdAt, data: n })),
      ...tracking.map((t) => ({ type: 'tracking' as const, ts: t.createdAt, data: t })),
      ...escalations.map((e) => ({ type: 'escalation' as const, ts: e.createdAt, data: e })),
    ].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

    // SLA flag: last tracking update
    const lastTracking = tracking[0];
    const daysSinceUpdate = lastTracking
      ? Math.floor((Date.now() - new Date(lastTracking.updatedAt).getTime()) / 86400000)
      : null;
    const slaAlert = daysSinceUpdate !== null && daysSinceUpdate >= 7;

    return { timeline, slaAlert, daysSinceUpdate, notes, tracking, escalations };
  }

  // ── Portal: engagement tracking (client-facing) ───────────────────────────

  async getEngagementTracking(engagementId: string) {
    return this.db.applicationTracking.findMany({
      where: { engagementId },
      select: {
        id: true,
        portal: true,
        referenceNumber: true,
        submittedAt: true,
        status: true,
        nextActionDate: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
