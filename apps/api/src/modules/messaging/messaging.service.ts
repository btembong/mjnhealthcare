import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '@mjn/database';
import { MessageSenderType } from '@mjn/database';

@Injectable()
export class MessagingService {
  constructor(private readonly db: DatabaseService) {}

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
    return this.db.engagementMessage.create({
      data: { engagementId, senderId, senderType, content },
      include: { sender: { select: { id: true, name: true, role: true } } },
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
