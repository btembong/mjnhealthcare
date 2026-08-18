import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '@mjn/database';
import { S3 } from 'aws-sdk';
import { Cron, CronExpression } from '@nestjs/schedule';

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

  async getByStatus(status: string) {
    return this.db.document.findMany({
      where: { status: status as any },
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
    return this.db.document.update({
      where: { id: documentId },
      data: {
        status,
        verifiedBy,
        verifiedAt: new Date(),
        ...(rejectionReason ? { rejectionReason } : {}),
      },
    });
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
