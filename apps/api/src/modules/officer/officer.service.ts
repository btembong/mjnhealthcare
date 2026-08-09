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
        createdAt: true,
        officerEngagements: {
          select: { id: true, status: true },
        },
      },
      orderBy: { name: 'asc' },
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
  ) {
    const engagement = await this.db.engagement.findUnique({
      where: { id: engagementId },
    });
    if (!engagement) throw new NotFoundException('Engagement not found');

    const note = await this.db.caseNote.create({
      data: { engagementId, authorId, content, isInternal },
      include: { author: { select: { id: true, name: true, role: true } } },
    });

    // When isInternal=false, send update to client and log to CommunicationLog
    if (!isInternal) {
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

    return note;
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
