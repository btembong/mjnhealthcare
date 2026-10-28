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

const OPEN_CASE = ['PENDING_SIGNATURE', 'ACTIVE', 'ON_HOLD'];

/** Older messages carried a file as a code inside the text; show its name instead. */
function previewText(content: string, attachmentName: string | null): string {
  const legacy = content.match(/^([\s\S]*?)\n?\[(?:IMG|FILE)\]:([^:]+):[\s\S]+$/);
  const text = (legacy ? legacy[1] : content).replace(/\s+/g, ' ').trim();
  const file = attachmentName ?? (legacy ? legacy[2] : null);
  return [text, file && `File: ${file}`].filter(Boolean).join(' · ').slice(0, 140);
}

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

  /**
   * One line per case for the staff inbox: the last thing said and whether the client is
   * waiting for an answer (the client spoke last). Waiting conversations come first, longest wait on top.
   */
  async getConversations(canSee: ((engagement: { consultantId?: string | null; officerId?: string | null }) => boolean) | null) {
    const all = await this.db.engagement.findMany({
      select: {
        id: true, status: true, consultantId: true, officerId: true, createdAt: true,
        person: { select: { id: true, name: true, email: true, profession: true } },
      },
    });
    const engagements = canSee ? all.filter(canSee) : all;
    if (engagements.length === 0) return [];
    const ids = engagements.map((e) => e.id);

    const [latest, unread] = await Promise.all([
      this.db.engagementMessage.findMany({
        where: { engagementId: { in: ids } },
        orderBy: { createdAt: 'desc' },
        distinct: ['engagementId'],
        select: { engagementId: true, content: true, senderType: true, senderId: true, createdAt: true, attachmentName: true, sender: { select: { name: true } } },
      }),
      this.db.engagementMessage.groupBy({
        by: ['engagementId'],
        where: { engagementId: { in: ids }, senderType: MessageSenderType.CLIENT, readAt: null },
        _count: { _all: true },
      }),
    ]);
    const lastBy = new Map(latest.map((m) => [m.engagementId, m]));
    const unreadBy = new Map(unread.map((g) => [g.engagementId, g._count._all]));

    const rows = engagements.map((e) => {
      const m = lastBy.get(e.id);
      const fromClient = m?.senderType === MessageSenderType.CLIENT;
      return {
        id: e.id,
        status: e.status,
        person: e.person,
        last: m ? { text: previewText(m.content, m.attachmentName), at: m.createdAt, fromClient, senderId: m.senderId, senderName: m.sender?.name ?? null } : null,
        needsReply: fromClient && OPEN_CASE.includes(e.status),
        unread: unreadBy.get(e.id) ?? 0,
        createdAt: e.createdAt,
      };
    });
    const time = (d?: Date | null) => (d ? d.getTime() : 0);
    return rows.sort((a, b) =>
      Number(b.needsReply) - Number(a.needsReply)
      || (a.needsReply ? time(a.last?.at) - time(b.last?.at) : time(b.last?.at) - time(a.last?.at))
      || time(b.createdAt) - time(a.createdAt));
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
   * Staff file a chat file into the client's documents. Nothing sent in chat is filed on its own.
   * A credential the client sent goes through the normal review. A file the team sent becomes a
   * document for the client to keep, under "From your team" in their portal.
   */
  async saveAttachmentAsDocument(messageId: string, documentType: string, staffId: string) {
    const type = (documentType ?? '').trim();
    if (!type) throw new BadRequestException('Choose what kind of document this is.');
    const message = await this.db.engagementMessage.findUnique({
      where: { id: messageId },
      select: { attachmentKey: true, senderType: true, senderId: true, engagementId: true, engagement: { select: { personId: true } } },
    });
    if (!message?.attachmentKey) throw new NotFoundException('This message has no file.');
    const fileUrl = `${process.env.R2_PUBLIC_URL}/${message.attachmentKey}`;
    const personId = message.engagement.personId;
    const existing = await this.db.document.findFirst({ where: { personId, fileUrl }, select: { id: true } });
    if (existing) return { documentId: existing.id, alreadySaved: true };

    if (message.senderType !== MessageSenderType.CLIENT) {
      // The client already saw the file in chat, so no separate notice is sent.
      const doc = await this.db.document.create({
        data: {
          personId, type, fileUrl, status: 'VERIFIED', origin: 'OFFICER_SENT', needsReturn: false,
          officerId: message.senderId ?? staffId, engagementId: message.engagementId,
          verifiedBy: staffId, verifiedAt: new Date(),
        },
      });
      return { documentId: doc.id, alreadySaved: false, forClientToKeep: true };
    }

    const doc = await this.db.document.create({
      data: { personId, type, fileUrl, status: 'PENDING' },
    });
    this.events.emit('document.uploaded', { documentId: doc.id, personId });
    return { documentId: doc.id, alreadySaved: false, forClientToKeep: false };
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

  async markRead(engagementId: string, readerIsStaff: boolean) {
    // One colleague opening the thread must not make another colleague's message look read by the client.
    await this.db.engagementMessage.updateMany({
      where: {
        engagementId,
        readAt: null,
        ...(readerIsStaff ? { senderType: MessageSenderType.CLIENT } : { NOT: { senderType: MessageSenderType.CLIENT } }),
      },
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
