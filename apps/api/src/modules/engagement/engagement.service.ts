import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '@mjn/database';
@Injectable()
export class EngagementService {
  private readonly logger = new Logger(EngagementService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly events: EventEmitter2,
  ) {}

  async findAll() {
    const engagements = await this.db.engagement.findMany({
      include: {
        person: { select: { id: true, name: true, email: true, phone: true, profession: true, locale: true } },
        milestones: true,
        orders: { select: { id: true, status: true, total: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Attach consultant names — consultantId stores a ConsultantProfile.id
    const ids = [...new Set(engagements.map((e) => e.consultantId).filter(Boolean))] as string[];
    const nameMap: Record<string, string> = {};
    if (ids.length) {
      const profiles = await this.db.consultantProfile.findMany({
        where: { id: { in: ids } },
      });
      profiles.forEach((p) => { nameMap[p.id] = p.name ?? p.id; });
    }

    return engagements.map((e) => ({
      ...e,
      consultantName: e.consultantId ? (nameMap[e.consultantId] ?? null) : null,
    }));
  }

  async findByClient(personId: string) {
    return this.db.engagement.findMany({
      where: { personId },
      include: { milestones: true, orders: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.db.engagement.findUniqueOrThrow({
      where: { id },
      include: {
        person: { select: { id: true, name: true, email: true, phone: true, profession: true, locale: true, createdAt: true } },
        milestones: { orderBy: { createdAt: 'asc' } },
        orders: {
          include: {
            lineItems: { include: { serviceItem: { select: { name: true } } } },
            receipts: { select: { id: true, issuedAt: true } },
            installmentSchedules: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        poaRecords: { orderBy: { capturedAt: 'desc' } },
      },
    });
  }

  async create(data: { personId: string; consultantId?: string }) {
    const engagement = await this.db.engagement.create({
      data: {
        personId: data.personId,
        consultantId: data.consultantId ?? '',
        status: 'PENDING_SIGNATURE',
      } as any,
      include: { person: { select: { id: true, name: true, email: true } } },
    });
    this.events.emit('engagement.created', { engagementId: engagement.id, personId: data.personId });
    return engagement;
  }

  async assignConsultant(engagementId: string, consultantId: string) {
    const engagement = await this.db.engagement.update({
      where: { id: engagementId },
      data: { consultantId },
      include: { person: { select: { id: true, name: true } } },
    });
    this.events.emit('engagement.consultant_assigned', { engagementId, consultantId });
    return engagement;
  }

  async sendSignatureEmail(engagementId: string): Promise<{ signUrl: string }> {
    const engagement = await this.db.engagement.findUniqueOrThrow({
      where: { id: engagementId },
      include: { person: true },
    });

    const portalUrl = process.env.PORTAL_URL ?? 'http://localhost:3002';
    const signUrl = `${portalUrl}/sign/${engagementId}`;

    // Persist the sign URL so the portal can link to it
    await (this.db.engagement as any).update({
      where: { id: engagementId },
      data: { letterUrl: signUrl },
    });

    this.events.emit('engagement.sign_requested', {
      engagementId,
      personName: engagement.person.name,
      personEmail: engagement.person.email,
      personPhone: engagement.person.phone ?? '',
      signUrl,
    });

    return { signUrl };
  }

  async signLetter(
    engagementId: string,
    signerPersonId: string,
    ip: string,
    userAgent: string,
  ): Promise<{ ok: boolean }> {
    const engagement = await this.db.engagement.findUniqueOrThrow({
      where: { id: engagementId },
      include: { person: true },
    });

    if (engagement.personId !== signerPersonId) {
      throw new Error('You are not authorised to sign this engagement letter.');
    }

    if (engagement.letterSignedAt) {
      return { ok: true }; // already signed — idempotent
    }

    // Audit record: who signed, from where, when
    await this.db.auditLog.create({
      data: {
        actorId: signerPersonId,
        action: 'engagement_letter_signed',
        resourceType: 'Engagement',
        resourceId: engagementId,
        metadata: { ip, userAgent },
      },
    });

    await this.onLetterSigned(engagementId, signerPersonId);
    return { ok: true };
  }

  async handleDropboxWebhook(payload: any): Promise<void> {
    const event = payload?.event?.event_type;
    if (event !== 'signature_request_signed') return;

    const engagementId = payload?.signature_request?.metadata?.engagementId;
    if (!engagementId) return;

    await this.onLetterSigned(engagementId, 'dropbox-sign-webhook');
  }

  async onLetterSigned(engagementId: string, signedBy: string) {
    const engagement = await this.db.engagement.update({
      where: { id: engagementId },
      data: { status: 'ACTIVE', letterSignedAt: new Date() },
      include: { person: true },
    });
    this.events.emit('engagement.letter_signed', { engagementId, signedBy, personId: engagement.personId });
    return engagement;
  }

  async updateStatus(engagementId: string, status: string) {
    const engagement = await this.db.engagement.update({
      where: { id: engagementId },
      data: { status: status as any },
    });
    this.events.emit('engagement.status_changed', { engagementId, status });
    return engagement;
  }

  async addMilestone(engagementId: string, label: string) {
    return this.db.engagementMilestone.create({ data: { engagementId, label } });
  }

  async completeMilestone(milestoneId: string) {
    return this.db.engagementMilestone.update({
      where: { id: milestoneId },
      data: { completedAt: new Date() },
    });
  }

  async sendClientMessage(engagementId: string, message: string) {
    const engagement = await this.db.engagement.findUniqueOrThrow({
      where: { id: engagementId },
      include: { person: { select: { id: true, name: true, email: true } } },
    });

    const consultant = engagement.consultantId
      ? await this.db.person.findUnique({ where: { id: engagement.consultantId }, select: { email: true } })
      : null;

    this.events.emit('client.message_sent', {
      engagementId,
      clientName: engagement.person.name,
      clientEmail: engagement.person.email,
      consultantEmail: consultant?.email,
      message,
    });

    return { success: true, message: 'Message sent to your consultant.' };
  }
}
