import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '@mjn/database';
import { S3 } from 'aws-sdk';
import { Cron, CronExpression } from '@nestjs/schedule';

type DocumentQuery = NonNullable<Parameters<DatabaseService['document']['findMany']>[0]>;

@Injectable()
export class DocumentService {
  private readonly s3 = new S3({
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    region: 'auto',
    signatureVersion: 'v4',
  });

  constructor(
    private readonly db: DatabaseService,
    private readonly events: EventEmitter2,
  ) {}

  async getUploadUrl(personId: string, documentType: string, fileName: string) {
    const key = `documents/${personId}/${documentType}/${Date.now()}-${fileName}`;
    const url = await this.s3.getSignedUrlPromise('putObject', {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Expires: 300,
    });
    return { url, key };
  }

  async confirmUpload(personId: string, documentType: string, key: string, expiryDate?: Date) {
    const doc = await this.db.document.create({
      data: {
        personId,
        type: documentType,
        fileUrl: `${process.env.R2_PUBLIC_URL}/${key}`,
        status: 'PENDING',
        expiryDate,
      },
    });
    this.events.emit('document.uploaded', { documentId: doc.id, personId });
    return doc;
  }

  async getByStatus(status?: string) {
    return this.db.document.findMany({
      where: status ? { status: status as any } : undefined,
      include: { person: { select: { id: true, name: true, email: true } } },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async getByPerson(personId: string) {
    return this.db.document.findMany({
      where: { personId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async verify(documentId: string, verifiedBy: string, status: 'VERIFIED' | 'REJECTED', rejectionReason?: string) {
    const doc = await this.db.document.update({
      where: { id: documentId },
      data: {
        status,
        verifiedBy,
        verifiedAt: new Date(),
        ...(rejectionReason ? { rejectionReason } : {}),
      },
    });
    // The client is told shortly afterwards, in one notice per review session.
    this.events.emit('document.reviewed', { documentId: doc.id, personId: doc.personId, status });
    return doc;
  }

  async getViewUrl(documentId: string) {
    const doc = await this.db.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');
    const publicPrefix = process.env.R2_PUBLIC_URL ?? '';
    const key = publicPrefix ? doc.fileUrl.replace(`${publicPrefix}/`, '') : doc.fileUrl;
    const url = await this.s3.getSignedUrlPromise('getObject', {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Expires: 300,
    });
    return { url };
  }

  // ── Review workspace ─────────────────────────────────────────────────────

  private scoped(hiddenPersonIds?: string[]) {
    return hiddenPersonIds?.length ? { personId: { notIn: hiddenPersonIds } } : {};
  }

  /** Documents waiting for review, longest-waiting first. */
  async getQueue(hiddenPersonIds?: string[]) {
    return this.db.document.findMany({
      where: { status: 'PENDING', ...this.scoped(hiddenPersonIds) },
      include: { person: { select: { id: true, name: true, email: true, profession: true, locale: true } } },
      orderBy: { uploadedAt: 'asc' },
      take: 500,
    });
  }

  async getCounts(hiddenPersonIds?: string[]) {
    const scope = this.scoped(hiddenPersonIds);
    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 86400000);
    const live = { in: ['PENDING', 'VERIFIED'] as any[] };
    const [all, pending, verified, rejected, expiring, expired, oldest] = await Promise.all([
      this.db.document.count({ where: scope }),
      this.db.document.count({ where: { ...scope, status: 'PENDING' } }),
      this.db.document.count({ where: { ...scope, status: 'VERIFIED' } }),
      this.db.document.count({ where: { ...scope, status: 'REJECTED' } }),
      this.db.document.count({ where: { ...scope, status: live, expiryDate: { gte: now, lte: soon } } }),
      this.db.document.count({ where: { ...scope, status: live, expiryDate: { lt: now } } }),
      this.db.document.findFirst({
        where: { ...scope, status: 'PENDING' },
        orderBy: { uploadedAt: 'asc' },
        select: { uploadedAt: true },
      }),
    ]);
    return { all, pending, verified, rejected, expiring, expired, oldestPendingAt: oldest?.uploadedAt ?? null };
  }

  /** One page of documents for the lookup table. */
  async search(
    params: { filter?: string; q?: string; type?: string; page?: number; pageSize?: number; sort?: string; dir?: string },
    hiddenPersonIds?: string[],
  ) {
    const page = Math.max(1, Math.floor(Number(params.page) || 1));
    const pageSize = Math.min(100, Math.max(10, Math.floor(Number(params.pageSize) || 25)));
    const dir: 'asc' | 'desc' = params.dir === 'asc' ? 'asc' : 'desc';
    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 86400000);
    const live = { in: ['PENDING', 'VERIFIED'] as any[] };

    const where: NonNullable<DocumentQuery['where']> = { ...this.scoped(hiddenPersonIds) };
    switch ((params.filter ?? '').toUpperCase()) {
      case 'PENDING':
      case 'VERIFIED':
      case 'REJECTED':
      case 'PENDING_CLIENT':
        where.status = (params.filter as string).toUpperCase() as any;
        break;
      case 'EXPIRING':
        where.status = live;
        where.expiryDate = { gte: now, lte: soon };
        break;
      case 'EXPIRED':
        where.status = live;
        where.expiryDate = { lt: now };
        break;
      default:
        break;
    }
    if (params.type) where.type = params.type;
    const q = (params.q ?? '').trim();
    if (q) {
      where.OR = [
        { person: { name: { contains: q, mode: 'insensitive' } } },
        { person: { email: { contains: q, mode: 'insensitive' } } },
        { type: { contains: q.replace(/\s+/g, '_'), mode: 'insensitive' } },
      ];
    }

    const orderBy: DocumentQuery['orderBy'] =
      params.sort === 'client' ? { person: { name: dir } }
      : params.sort === 'type' ? { type: dir }
      : params.sort === 'status' ? { status: dir }
      : params.sort === 'expiry' ? { expiryDate: { sort: dir, nulls: 'last' } }
      : { uploadedAt: dir };

    const [items, total] = await Promise.all([
      this.db.document.findMany({
        where,
        include: { person: { select: { id: true, name: true, email: true, profession: true, locale: true } } },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.db.document.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  /** Puts a reviewed document back in the queue (undo of verify or reject). */
  async reopen(documentId: string) {
    const doc = await this.db.document.findUnique({ where: { id: documentId }, select: { id: true } });
    if (!doc) throw new NotFoundException('Document not found');
    return this.db.document.update({
      where: { id: documentId },
      data: { status: 'PENDING', verifiedBy: null, verifiedAt: null, rejectionReason: null },
    });
  }

  /** What a reviewer needs to know about the client behind a document. */
  async getReviewContext(personId: string) {
    const [person, engagements, documents] = await Promise.all([
      this.db.person.findUnique({
        where: { id: personId },
        select: { id: true, name: true, email: true, profession: true, locale: true },
      }),
      this.db.engagement.findMany({
        where: { personId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          milestones: { select: { id: true, label: true, completedAt: true }, orderBy: { createdAt: 'asc' } },
        },
      }),
      this.db.document.findMany({
        where: { personId },
        orderBy: { uploadedAt: 'desc' },
        select: { id: true, type: true, status: true, expiryDate: true, uploadedAt: true },
      }),
    ]);
    if (!person) throw new NotFoundException('Person not found');

    const engagement = engagements.find((e) => e.status === 'ACTIVE') ?? engagements[0] ?? null;
    let stage: { label: string; index: number; total: number; pathway?: string } | null = null;
    let requiredDocTypes: string[] = [];

    if (engagement) {
      const progress = await this.db.licensingProgress.findFirst({
        where: { personId, engagementId: engagement.id },
        include: {
          currentStage: {
            include: { pathway: { include: { stages: { select: { id: true }, orderBy: { order: 'asc' } } } } },
          },
        },
      });
      if (progress?.currentStage) {
        const stages = progress.currentStage.pathway.stages;
        stage = {
          label: progress.currentStage.label,
          index: stages.findIndex((s) => s.id === progress.currentStageId) + 1,
          total: stages.length,
          pathway: `${progress.currentStage.pathway.country} · ${progress.currentStage.pathway.regulatoryBody}`,
        };
        requiredDocTypes = progress.currentStage.requiredDocs ?? [];
      } else if (engagement.milestones.length > 0) {
        const current = engagement.milestones.findIndex((m) => !m.completedAt);
        const at = current === -1 ? engagement.milestones.length - 1 : current;
        stage = {
          label: current === -1 ? 'All stages complete' : engagement.milestones[at].label,
          index: at + 1,
          total: engagement.milestones.length,
        };
      }
    }

    return {
      person,
      engagement: engagement ? { id: engagement.id, status: engagement.status } : null,
      stage,
      requiredDocTypes,
      documents,
    };
  }

  // ── Officer: send blank form to client ───────────────────────────────────

  async officerSendDocument(
    engagementId: string,
    officerId: string,
    data: { type: string; key: string; officerNote?: string },
  ) {
    const engagement = await this.db.engagement.findUnique({
      where: { id: engagementId },
      select: { personId: true },
    });
    if (!engagement) throw new NotFoundException('Engagement not found');

    const doc = await this.db.document.create({
      data: {
        personId: engagement.personId,
        type: data.type,
        fileUrl: `${process.env.R2_PUBLIC_URL}/${data.key}`,
        status: 'PENDING_CLIENT',
        origin: 'OFFICER_SENT',
        officerId,
        engagementId,
        officerNote: data.officerNote,
      },
    });

    this.events.emit('document.officer_sent', {
      personId: engagement.personId,
      documentId: doc.id,
      documentType: data.type,
      officerNote: data.officerNote,
    });

    return doc;
  }

  // ── Client: return filled form ────────────────────────────────────────────

  async clientReturnDocument(
    personId: string,
    linkedDocumentId: string,
    data: { key: string; type: string },
  ) {
    const original = await this.db.document.findUnique({ where: { id: linkedDocumentId } });
    if (!original) throw new NotFoundException('Original document not found');

    const doc = await this.db.document.create({
      data: {
        personId,
        type: data.type,
        fileUrl: `${process.env.R2_PUBLIC_URL}/${data.key}`,
        status: 'PENDING',
        origin: 'CLIENT_RETURN',
        linkedDocumentId,
        engagementId: original.engagementId,
      },
    });

    // Mark original as received
    await this.db.document.update({
      where: { id: linkedDocumentId },
      data: { status: 'PENDING' },
    });

    this.events.emit('document.client_returned', {
      personId,
      documentId: doc.id,
      documentType: data.type,
      officerId: original.officerId,
      engagementId: original.engagementId,
    });

    return doc;
  }

  // ── Get officer-sent documents for an engagement ─────────────────────────

  async getOfficerSentDocuments(engagementId: string) {
    return this.db.document.findMany({
      where: { engagementId, origin: 'OFFICER_SENT' },
      include: { linkedReturns: { select: { id: true, status: true, uploadedAt: true } } },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  // ── Get pending-client documents for a person (portal) ───────────────────

  async getPendingClientDocuments(personId: string) {
    return this.db.document.findMany({
      where: { personId, origin: 'OFFICER_SENT', status: 'PENDING_CLIENT' },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async scanExpiringDocuments() {
    const thresholds = [30, 14, 3];
    for (const days of thresholds) {
      const target = new Date();
      target.setDate(target.getDate() + days);
      const docs = await this.db.document.findMany({
        where: {
          status: 'VERIFIED',
          expiryDate: { gte: new Date(), lte: target },
        },
      });
      docs.forEach((doc) =>
        this.events.emit('document.expiring_soon', { personId: doc.personId, documentId: doc.id, daysLeft: days }),
      );
    }
  }
}
