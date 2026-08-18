import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '@mjn/database';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class OfficerService {
  constructor(
    private readonly db: DatabaseService,
    private readonly events: EventEmitter2,
  ) {}

  // ── Admin: create / list officers ─────────────────────────────────────────

  async createOfficer(data: {
    name: string;
    email: string;
    password: string;
  }) {
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
  ) {
    const officer = await this.db.person.findUnique({ where: { id: officerId } });
    if (!officer || officer.role !== 'PROCESSING_OFFICER')
      throw new NotFoundException('Officer not found');

    await this.db.person.update({
      where: { id: officerId },
      data: { isAvailable },
    });

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

  async getMyCases(officerId: string) {
    return this.db.engagement.findMany({
      where: { officerId },
      include: {
        person: {
          select: { id: true, name: true, email: true, phone: true, profession: true },
        },
        milestones: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: {
          select: { caseNotes: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getCaseById(engagementId: string, officerId: string) {
    const engagement = await this.db.engagement.findUnique({
      where: { id: engagementId },
      include: {
        person: true,
        milestones: { orderBy: { createdAt: 'asc' } },
        orders: {
          include: { lineItems: true },
          orderBy: { createdAt: 'desc' },
        },
        officer: { select: { id: true, name: true, email: true } },
        caseNotes: {
          include: { author: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
        applicationTracking: { orderBy: { createdAt: 'desc' } },
        escalations: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!engagement) throw new NotFoundException('Engagement not found');
    if (engagement.officerId !== officerId)
      throw new ForbiddenException('Not assigned to this case');

    return engagement;
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

  async rejectNote(noteId: string) {
    const note = await this.db.caseNote.findUnique({ where: { id: noteId } });
    if (!note) throw new NotFoundException('Note not found');
    // Rejection: make fully internal so it never reaches client
    return this.db.caseNote.update({
      where: { id: noteId },
      data: { isInternal: true, requiresApproval: false },
    });
  }

  async getPendingApprovals(consultantId: string) {
    return this.db.caseNote.findMany({
      where: {
        isInternal: false,
        requiresApproval: true,
        approvedAt: null,
        engagement: { consultantId },
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

  async getMyDashboard(officerId: string) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // All engagements assigned to this officer
    const cases = await this.db.engagement.findMany({
      where: { officerId },
      include: {
        person: { select: { id: true, name: true, email: true, profession: true } },
        caseNotes: {
          where: { author: { id: officerId } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        applicationTracking: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    // Overdue tracking entries (nextActionDate past)
    const overdueTracking = await this.db.applicationTracking.findMany({
      where: {
        engagement: { officerId },
        nextActionDate: { lte: today },
        status: { notIn: ['APPROVED', 'REJECTED'] },
      },
      include: { engagement: { include: { person: { select: { name: true } } } } },
      orderBy: { nextActionDate: 'asc' },
    });

    // Open escalations raised by this officer
    const escalations = await this.db.caseEscalation.findMany({
      where: { officerId, status: 'OPEN' },
      include: { engagement: { include: { person: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    // Sensitive updates awaiting consultant approval
    const pendingApprovals = await this.db.caseNote.findMany({
      where: {
        authorId: officerId,
        requiresApproval: true,
        approvedAt: null,
        isInternal: false,
      },
      include: { engagement: { include: { person: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    // Recent activity (notes + tracking) across all cases
    const recentNotes = await this.db.caseNote.findMany({
      where: { authorId: officerId },
      include: { engagement: { include: { person: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    const recentTracking = await this.db.applicationTracking.findMany({
      where: { engagement: { officerId } },
      include: { engagement: { include: { person: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    // Upcoming deadlines: nextActionDate in next 7 days (not overdue, not terminal)
    const sevenDaysOut = new Date();
    sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
    sevenDaysOut.setHours(23, 59, 59, 999);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const upcomingDeadlines = await this.db.applicationTracking.findMany({
      where: {
        engagement: { officerId },
        nextActionDate: { gte: now, lte: sevenDaysOut },
        status: { notIn: ['APPROVED', 'REJECTED'] },
      },
      include: { engagement: { include: { person: { select: { name: true } } } } },
      orderBy: { nextActionDate: 'asc' },
    });

    // This week's activity counts
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const [weekNotes, weekClientUpdates, weekTracking] = await Promise.all([
      this.db.caseNote.count({ where: { authorId: officerId, isInternal: true, createdAt: { gte: weekStart } } }),
      this.db.caseNote.count({ where: { authorId: officerId, isInternal: false, createdAt: { gte: weekStart } } }),
      this.db.applicationTracking.count({ where: { engagement: { officerId }, createdAt: { gte: weekStart } } }),
    ]);

    // Pipeline breakdown: latest tracking status per case
    const allTracking = await this.db.applicationTracking.findMany({
      where: { engagement: { officerId } },
      orderBy: { createdAt: 'desc' },
    });
    const latestPerCase = new Map<string, string>();
    allTracking.forEach(t => { if (!latestPerCase.has(t.engagementId)) latestPerCase.set(t.engagementId, t.status); });
    const pipeline: Record<string, number> = { SUBMITTED: 0, IN_REVIEW: 0, PENDING_DOCS: 0, RESUBMITTED: 0, APPROVED: 0, REJECTED: 0, NO_TRACKING: 0 };
    cases.forEach(c => {
      const status = latestPerCase.get(c.id) ?? 'NO_TRACKING';
      if (pipeline[status] !== undefined) pipeline[status]++;
      else pipeline['NO_TRACKING']++;
    });

    return {
      stats: {
        totalCases: cases.length,
        slaAlerts: overdueTracking.length,
        openEscalations: escalations.length,
        awaitingApproval: pendingApprovals.length,
      },
      thisWeek: {
        notes: weekNotes,
        clientUpdates: weekClientUpdates,
        trackingEntries: weekTracking,
      },
      pipeline,
      cases,
      overdueTracking,
      upcomingDeadlines,
      escalations,
      pendingApprovals,
      recentActivity: [...recentNotes.map(n => ({ ...n, _type: 'note' })), ...recentTracking.map(t => ({ ...t, _type: 'tracking' }))]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10),
    };
  }

  async getRecentOfficerNotes(limit = 20) {
    return this.db.caseNote.findMany({
      where: { author: { role: 'PROCESSING_OFFICER' } },
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
    trackingId: string,
    data: {
      referenceNumber?: string;
      status?: string;
      notes?: string;
      nextActionDate?: string;
    },
  ) {
    const record = await this.db.applicationTracking.findUnique({
      where: { id: trackingId },
    });
    if (!record) throw new NotFoundException('Tracking record not found');

    return this.db.applicationTracking.update({
      where: { id: trackingId },
      data: {
        referenceNumber: data.referenceNumber,
        status: data.status,
        notes: data.notes,
        nextActionDate: data.nextActionDate
          ? new Date(data.nextActionDate)
          : undefined,
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
    consultantId: string,
    reason: string,
  ) {
    const engagement = await this.db.engagement.findUnique({
      where: { id: engagementId },
    });
    if (!engagement) throw new NotFoundException('Engagement not found');

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
