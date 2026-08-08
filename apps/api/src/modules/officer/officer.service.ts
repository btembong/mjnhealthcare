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

  async assignOfficer(engagementId: string, officerId: string | null) {
    const engagement = await this.db.engagement.findUnique({
      where: { id: engagementId },
    });
    if (!engagement) throw new NotFoundException('Engagement not found');

    if (officerId) {
      const officer = await this.db.person.findUnique({ where: { id: officerId } });
      if (!officer || officer.role !== 'PROCESSING_OFFICER')
        throw new NotFoundException('Officer not found');
    }

    return this.db.engagement.update({
      where: { id: engagementId },
      data: { officerId },
      select: { id: true, officerId: true },
    });
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

    return this.db.caseNote.create({
      data: { engagementId, authorId, content, isInternal },
      include: { author: { select: { id: true, name: true, role: true } } },
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

    return this.db.caseEscalation.update({
      where: { id: escalationId },
      data: { status: 'RESOLVED', resolvedAt: new Date(), resolution },
    });
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
}
