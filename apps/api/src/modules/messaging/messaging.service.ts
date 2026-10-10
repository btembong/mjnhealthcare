import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '@mjn/database';
import { MessageSenderType } from '@mjn/database';
import { findConsultantContact } from '../../common/consultant-contact';

// A client sending several messages in a row triggers one email, not one per message.
const NOTIFY_QUIET_MINUTES = 15;

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly events: EventEmitter2,
  ) {}

  async getMessages(engagementId: string) {
    const engagement = await this.db.engagement.findUnique({ where: { id: engagementId } });
    if (!engagement) throw new NotFoundException('Engagement not found');
    return this.db.engagementMessage.findMany({
      where: { engagementId },
      include: { sender: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(engagementId: string, senderId: string, senderType: MessageSenderType, content: string) {
    const engagement = await this.db.engagement.findUnique({ where: { id: engagementId } });
    if (!engagement) throw new NotFoundException('Engagement not found');
    const message = await this.db.engagementMessage.create({
      data: { engagementId, senderId, senderType, content },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });

    if (senderType === MessageSenderType.CLIENT) {
      // Never let a notification problem fail the message itself.
      this.notifyConsultant(engagementId, engagement.consultantId, message.id, message.sender?.name, content).catch(
        (err) => this.logger.error(`Could not notify consultant of message ${message.id}: ${err?.message ?? err}`),
      );
    }
    return message;
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
