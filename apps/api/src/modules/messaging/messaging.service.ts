import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '@mjn/database';
import { MessageSenderType } from '@mjn/database';
import { S3 } from 'aws-sdk';
import { findConsultantContact } from '../../common/consultant-contact';

// A client sending several messages in a row triggers one email, not one per message.
const NOTIFY_QUIET_MINUTES = 15;

const ATTACHMENT_EXT = /\.(pdf|jpe?g|png|docx?)$/i;
const IMAGE_EXT = /\.(jpe?g|png)$/i;

export type MessageAttachment = { key: string; name: string; type?: string };

type StoredMessage = {
  attachmentKey: string | null;
  attachmentName: string | null;
  attachmentType: string | null;
  [field: string]: unknown;
};

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

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

  /** What the browser gets: the file's name and kind, never where it is stored. */
  private present<T extends StoredMessage>(message: T) {
    const { attachmentKey, attachmentName, attachmentType, ...rest } = message;
    return {
      ...rest,
      attachment: attachmentKey
        ? {
            name: attachmentName ?? 'Attachment',
            type: attachmentType ?? '',
            isImage: IMAGE_EXT.test(attachmentName ?? '') || (attachmentType ?? '').startsWith('image/'),
          }
        : null,
    };
  }

  async getMessages(engagementId: string) {
    const engagement = await this.db.engagement.findUnique({ where: { id: engagementId } });
    if (!engagement) throw new NotFoundException('Engagement not found');
    const messages = await this.db.engagementMessage.findMany({
      where: { engagementId },
      include: { sender: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return messages.map((m) => this.present(m));
  }

  /** Where the browser may put a file it is about to send in this conversation. */
  async getAttachmentUploadUrl(engagementId: string, fileName: string) {
    if (!ATTACHMENT_EXT.test(fileName ?? '')) {
      throw new BadRequestException('Only PDF, JPG, PNG and Word files can be sent.');
    }
    const safeName = fileName.replace(/[^A-Za-z0-9._-]+/g, '-').slice(-120);
    const key = `chat/${engagementId}/${Date.now()}-${safeName}`;
    const url = await this.s3.getSignedUrlPromise('putObject', {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Expires: 300,
    });
    return { url, key };
  }

  async sendMessage(
    engagementId: string,
    senderId: string,
    senderType: MessageSenderType,
    content: string,
    attachment?: MessageAttachment | null,
  ) {
    const engagement = await this.db.engagement.findUnique({ where: { id: engagementId } });
    if (!engagement) throw new NotFoundException('Engagement not found');

    const text = (content ?? '').trim();
    if (!text && !attachment) throw new BadRequestException('Write a message or attach a file.');
    // A file can only be attached from the place this conversation was given to upload it.
    if (attachment && !attachment.key.startsWith(`chat/${engagementId}/`)) {
      throw new BadRequestException('That file does not belong to this conversation.');
    }

    const message = await this.db.engagementMessage.create({
      data: {
        engagementId,
        senderId,
        senderType,
        content: text,
        attachmentKey: attachment?.key ?? null,
        attachmentName: attachment ? (attachment.name || 'Attachment').slice(0, 200) : null,
        attachmentType: attachment?.type?.slice(0, 100) ?? null,
      },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });

    if (senderType === MessageSenderType.CLIENT) {
      const summary = [text, attachment && `Sent a file: ${attachment.name}`].filter(Boolean).join('\n');
      // Never let a notification problem fail the message itself.
      this.notifyConsultant(engagementId, engagement.consultantId, message.id, message.sender?.name, summary).catch(
        (err) => this.logger.error(`Could not notify consultant of message ${message.id}: ${err?.message ?? err}`),
      );
    }
    return this.present(message);
  }

  /** The case a message belongs to, for access checks. */
  async messageEngagementId(messageId: string): Promise<string> {
    const message = await this.db.engagementMessage.findUnique({ where: { id: messageId }, select: { engagementId: true } });
    if (!message) throw new NotFoundException('Message not found');
    return message.engagementId;
  }

  /** A link to a message's file that stops working after five minutes. */
  async getAttachmentViewUrl(messageId: string) {
    const message = await this.db.engagementMessage.findUnique({
      where: { id: messageId },
      select: { attachmentKey: true, attachmentName: true },
    });
    if (!message?.attachmentKey) throw new NotFoundException('This message has no file.');
    const url = await this.s3.getSignedUrlPromise('getObject', {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: message.attachmentKey,
      Expires: 300,
    });
    return { url, name: message.attachmentName ?? 'Attachment' };
  }

  /**
   * Staff file a credential a client sent in chat, so it goes through the normal review.
   * Nothing sent in chat is filed on its own.
   */
  async saveAttachmentAsDocument(messageId: string, documentType: string) {
    const type = (documentType ?? '').trim();
    if (!type) throw new BadRequestException('Choose what kind of document this is.');
    const message = await this.db.engagementMessage.findUnique({
      where: { id: messageId },
      select: { attachmentKey: true, senderType: true, engagement: { select: { personId: true } } },
    });
    if (!message?.attachmentKey) throw new NotFoundException('This message has no file.');
    if (message.senderType !== MessageSenderType.CLIENT) {
      throw new BadRequestException('Only a file the client sent can be saved to their documents.');
    }

    const fileUrl = `${process.env.R2_PUBLIC_URL}/${message.attachmentKey}`;
    const personId = message.engagement.personId;
    const existing = await this.db.document.findFirst({ where: { personId, fileUrl }, select: { id: true } });
    if (existing) return { documentId: existing.id, alreadySaved: true };

    const doc = await this.db.document.create({
      data: { personId, type, fileUrl, status: 'PENDING' },
    });
    this.events.emit('document.uploaded', { documentId: doc.id, personId });
    return { documentId: doc.id, alreadySaved: false };
  }

  private async notifyConsultant(
    engagementId: string,
    consultantId: string | null,
    messageId: string,
    clientName: string | null | undefined,
    content: string,
  ) {
    const since = new Date(Date.now() - NOTIFY_QUIET_MINUTES * 60 * 1000);
    const recentUnread = await this.db.engagementMessage.count({
      where: {
        engagementId,
        senderType: MessageSenderType.CLIENT,
        readAt: null,
        createdAt: { gte: since },
        NOT: { id: messageId },
      },
    });
    if (recentUnread > 0) return;

    const consultant = await findConsultantContact(this.db, consultantId);
    this.events.emit('client.message_sent', {
      engagementId,
      clientName: clientName ?? 'A client',
      consultantName: consultant?.name ?? undefined,
      consultantEmail: consultant?.email ?? undefined,
      message: content,
    });
  }

  async markRead(engagementId: string, readerId: string) {
    // Mark all messages in this engagement not sent by the reader as read
    await this.db.engagementMessage.updateMany({
      where: { engagementId, readAt: null, NOT: { senderId: readerId } },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  async getUnreadCount(personId: string) {
    const count = await this.db.engagementMessage.count({
      where: {
        readAt: null,
        NOT: { senderId: personId },
        engagement: { personId },
      },
    });
    return { unread: count };
  }
}
