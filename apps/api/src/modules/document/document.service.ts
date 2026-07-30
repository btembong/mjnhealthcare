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
