import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '@mjn/database';
import { DOCUMENT_CHECKLISTS } from './document-checklists';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument: any = require('pdfkit');
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

    // Attach consultant name + email — consultantId stores a ConsultantProfile.id
    const ids = [...new Set(engagements.map((e) => e.consultantId).filter(Boolean))] as string[];
    const nameMap:  Record<string, string> = {};
    const emailMap: Record<string, string> = {};
    if (ids.length) {
      const profiles = await this.db.consultantProfile.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, email: true },
      });
      profiles.forEach((p) => {
        nameMap[p.id]  = p.name ?? p.id;
        if (p.email) emailMap[p.id] = p.email;
      });
    }

    return engagements.map((e) => ({
      ...e,
      consultantName:  e.consultantId ? (nameMap[e.consultantId]  ?? null) : null,
      consultantEmail: e.consultantId ? (emailMap[e.consultantId] ?? null) : null,
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
    const engagement = await this.db.engagement.findUnique({
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
    if (!engagement) throw new NotFoundException('Engagement not found');
    return engagement;
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

  // ── Generate engagement letter PDF ───────────────────────────────────────

  async generateLetterPdf(engagementId: string): Promise<Buffer> {
    const engagement = await this.db.engagement.findUnique({
      where: { id: engagementId },
      include: {
        person: { select: { name: true, email: true, phone: true, profession: true } },
      },
    });
    if (!engagement) throw new NotFoundException('Engagement not found');
    if (!engagement.letterSignedAt) throw new BadRequestException('Engagement letter has not been signed yet');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 60, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const primary = '#0F4C81';
      const signedDate = new Date(engagement.letterSignedAt!).toLocaleDateString('en-US', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
      const ref = `ENG-${engagementId.slice(-6).toUpperCase()}`;

      // Header bar
      doc.rect(0, 0, doc.page.width, 80).fill(primary);
      doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
        .text('MJN Health Academy & Professional Services', 60, 25, { align: 'left' });
      doc.fontSize(10).font('Helvetica').text('mjnhealthcare.com  ·  info@mjnhealthcare.com', 60, 52);

      doc.fillColor('#1a1a1a').moveDown(3);

      // Title
      doc.fontSize(18).font('Helvetica-Bold').fillColor(primary)
        .text('ENGAGEMENT LETTER', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').fillColor('#555')
        .text(`Reference: ${ref}  ·  Signed: ${signedDate}`, { align: 'center' });

      doc.moveDown(1.5);
      doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).strokeColor('#ddd').lineWidth(1).stroke();
      doc.moveDown(1);

      // Client info
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a1a1a').text('CLIENT DETAILS');
      doc.moveDown(0.5);
      const p = engagement.person;
      const details = [
        ['Full Name', p.name],
        ['Email', p.email ?? '—'],
        ['Phone', p.phone ?? '—'],
        ['Profession', p.profession ?? '—'],
        ['Engagement Ref', ref],
        ['Date Signed', signedDate],
      ];
      details.forEach(([label, value]) => {
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#555').text(`${label}:`, { continued: true });
        doc.font('Helvetica').fillColor('#1a1a1a').text(`  ${value}`);
      });

      doc.moveDown(1.5);
      doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).strokeColor('#ddd').stroke();
      doc.moveDown(1);

      // Scope
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a1a1a').text('SCOPE OF ENGAGEMENT');
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10).fillColor('#333').text(
        'MJN Health Academy and Professional Services ("MJN") agrees to provide professional consulting services to the above-named client, which may include one or more of the following, as agreed at engagement creation:',
        { lineGap: 4 }
      );
      doc.moveDown(0.5);
      ['Healthcare Staffing & Global Placement (UAE, UK, US, Ireland, and other markets)',
       'Licensure Support (DataFlow, DHA, MOH, DOH, NMC, NCLEX/CGFNS, NMBI, and related bodies)',
       'Academy Exam Preparation (NCLEX, CBT, HAAD, DHA, DA)',
       'Student Support Services (internship placement, study-abroad, university applications)',
      ].forEach((item) => {
        doc.text(`• ${item}`, { indent: 15, lineGap: 3 });
      });

      doc.moveDown(1.5);
      doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).strokeColor('#ddd').stroke();
      doc.moveDown(1);

      // Disclaimers
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a1a1a').text('IMPORTANT DISCLAIMERS');
      doc.moveDown(0.5);
      const disclaimers = [
        'MJN does not guarantee exam pass rates, visa approvals, or job placement outcomes.',
        'Third-party fees (DataFlow, NMC, CGFNS, etc.) are charged by the respective bodies and are non-refundable once submitted.',
        'Refund eligibility for MJN service fees depends on the stage at which a cancellation request is made — refer to the Refund Policy available on our website.',
        'MJN acts as your authorised agent only upon receipt of a signed Power of Attorney / Letter of Authorization for each third-party submission.',
        'All documents uploaded to MJN systems are stored securely and used solely for the purpose of this engagement.',
      ];
      disclaimers.forEach((d) => {
        doc.font('Helvetica').fontSize(10).fillColor('#333').text(`• ${d}`, { indent: 15, lineGap: 4 });
        doc.moveDown(0.3);
      });

      doc.moveDown(1);
      doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).strokeColor('#ddd').stroke();
      doc.moveDown(1);

      // Signature block
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a1a1a').text('SIGNATURE');
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10).fillColor('#333').text(
        `By signing this letter, the client agrees to the scope, terms, and disclaimers set out above and authorises MJN to begin providing services.`
      );
      doc.moveDown(1.5);
      doc.font('Helvetica-Bold').fillColor(primary)
        .text(`✓ Electronically signed by ${p.name} on ${signedDate}`);
      doc.moveDown(0.3);
      doc.font('Helvetica').fontSize(9).fillColor('#888')
        .text(`Digital signature captured via MJN client portal. IP address and user agent logged for audit purposes. Reference: ${ref}`);

      // Footer
      const footerY = doc.page.height - 45;
      doc.rect(0, footerY, doc.page.width, 45).fill('#f7f7f7');
      doc.fillColor('#999').fontSize(8).font('Helvetica')
        .text('MJN Health Academy and Professional Services  ·  Confidential document  ·  Do not distribute', 60, footerY + 10);
      doc.text(`Generated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}  ·  ${ref}`, 60, footerY + 22);

      doc.end();
    });
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

  async sendDocumentChecklist(engagementId: string, pathwayKey: string, staffPersonId: string) {
    const checklist = DOCUMENT_CHECKLISTS[pathwayKey];
    if (!checklist) throw new BadRequestException(`Unknown pathway: ${pathwayKey}`);

    const engagement = await this.db.engagement.findUnique({
      where: { id: engagementId },
      include: { person: { select: { id: true, name: true, email: true, phone: true } } },
    });
    if (!engagement) throw new NotFoundException('Engagement not found');
    const person = engagement.person;

    // Emit event so NotificationListener sends the email
    this.events.emit('engagement.checklist_sent', {
      personName: person.name ?? 'Client',
      personEmail: person.email,
      pathway: checklist.pathway,
      regulatoryBody: checklist.regulatoryBody,
      country: checklist.country,
      items: checklist.items,
    });

    // Also post as a chat message so the client sees it in the portal
    const lines = checklist.items.map((item, i) => `${i + 1}. ${item.label}${item.note ? ` (${item.note})` : ''}`).join('\n');
    const chatMessage = `📋 Document Checklist — ${checklist.pathway}\n\nPlease upload the following documents to your document vault:\n\n${lines}\n\nUpload at: ${process.env.PORTAL_URL ?? 'http://localhost:3002'}/documents`;

    await this.db.engagementMessage.create({
      data: {
        engagementId,
        senderId: staffPersonId,
        senderType: 'ADMIN',
        content: chatMessage,
      },
    });

    this.logger.log(`Document checklist (${pathwayKey}) sent for engagement ${engagementId}`);
    return { ok: true, pathway: checklist.pathway };
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
