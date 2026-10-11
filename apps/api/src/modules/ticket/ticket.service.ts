import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '@mjn/database';
import { TicketCategory, TicketPriority, TicketStatus, TicketAuthorRole } from '@mjn/database';
import { S3 } from 'aws-sdk';

// A solved request can be reopened by replying for this long; after that a new one is started.
const REOPEN_DAYS = 14;
// Several client messages in a row alert the support inbox once, not once each.
const NOTIFY_QUIET_MINUTES = 15;

const ATTACHMENT_EXT = /\.(pdf|jpe?g|png|docx?)$/i;
const IMAGE_EXT = /\.(jpe?g|png)$/i;
const SOLVED: string[] = [TicketStatus.RESOLVED, TicketStatus.CLOSED];

export type TicketAttachment = { key: string; name: string; type?: string };

type StoredReply = {
  attachmentKey: string | null;
  attachmentName: string | null;
  attachmentType: string | null;
  authorRole: TicketAuthorRole;
  createdAt: Date;
  [field: string]: unknown;
};

@Injectable()
export class TicketService {
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

  /** What the browser gets for a message: the file's name and kind, never where it is stored. */
  private presentReply<T extends StoredReply>(reply: T) {
    const { attachmentKey, attachmentName, attachmentType, ...rest } = reply;
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

  /**
   * Adds whose turn it is: 'us' when the client wrote last, 'client' when we did, 'solved' when closed.
   * `unread` is true when we replied and the client has not opened the request since.
   */
  private present(ticket: any) {
    const replies: StoredReply[] = ticket.replies ?? [];
    const last = replies.reduce<StoredReply | null>((latest, r) => (!latest || r.createdAt > latest.createdAt ? r : latest), null);
    const solved = SOLVED.includes(ticket.status);
    const fromUs = !!last && last.authorRole !== TicketAuthorRole.CLIENT;
    const solvedAt: Date | null = solved ? ticket.resolvedAt ?? ticket.updatedAt ?? null : null;
    return {
      ...ticket,
      replies: replies.map((r) => this.presentReply(r)),
      turn: solved ? 'solved' : fromUs ? 'client' : 'us',
      unread: !solved && fromUs && (!ticket.clientSeenAt || ticket.clientSeenAt < (last as StoredReply).createdAt),
      lastActivityAt: last?.createdAt ?? ticket.createdAt,
      canReopen: solved && !!solvedAt && Date.now() - solvedAt.getTime() < REOPEN_DAYS * 86400000,
    };
  }

  private checkAttachment(attachment: TicketAttachment | null | undefined, uploaderId: string) {
    if (!attachment) return;
    // A file can only be attached from the place this person was given to upload it.
    if (!attachment.key.startsWith(`tickets/${uploaderId}/`)) {
      throw new BadRequestException('That file was not uploaded for this request.');
    }
  }

  /** Where the browser may put a file it is about to send with a support message. */
  async getAttachmentUploadUrl(uploaderId: string, fileName: string) {
    if (!ATTACHMENT_EXT.test(fileName ?? '')) {
      throw new BadRequestException('Only PDF, JPG, PNG and Word files can be sent.');
    }
    const safeName = fileName.replace(/[^A-Za-z0-9._-]+/g, '-').slice(-120);
    const key = `tickets/${uploaderId}/${Date.now()}-${safeName}`;
    const url = await this.s3.getSignedUrlPromise('putObject', { Bucket: process.env.R2_BUCKET_NAME, Key: key, Expires: 300 });
    return { url, key };
  }

  async createTicket(personId: string, subject: string, category: TicketCategory, content: string, attachment?: TicketAttachment | null) {
    const title = (subject ?? '').trim();
    const text = (content ?? '').trim();
    if (!title || !text) throw new BadRequestException('Add a subject and tell us what happened.');
    this.checkAttachment(attachment, personId);

    const ticket = await this.db.supportTicket.create({
      data: { personId, subject: title.slice(0, 200), category, clientSeenAt: new Date() },
    });
    await this.db.ticketReply.create({
      data: {
        ticketId: ticket.id, authorId: personId, authorRole: TicketAuthorRole.CLIENT, content: text,
        attachmentKey: attachment?.key ?? null,
        attachmentName: attachment ? (attachment.name || 'Attachment').slice(0, 200) : null,
        attachmentType: attachment?.type?.slice(0, 100) ?? null,
      },
    });
    const created = await this.db.supportTicket.findUnique({
      where: { id: ticket.id },
      include: { replies: true, person: { select: { id: true, name: true, email: true } } },
    });
    this.events.emit('ticket.created', {
      ticketId: ticket.id,
      subject: ticket.subject,
      category,
      content: text,
      attachmentName: attachment?.name ?? null,
      clientName: created?.person?.name ?? 'A client',
      clientEmail: created?.person?.email ?? null,
    });
    return this.present(created);
  }

  async getMyTickets(personId: string) {
    const tickets = await this.db.supportTicket.findMany({
      where: { personId },
      include: { replies: { orderBy: { createdAt: 'asc' } } },
    });
    // Whatever moved last comes first.
    return tickets.map((t) => this.present(t)).sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());
  }

  async getTicket(ticketId: string) {
    const ticket = await this.db.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        replies: { orderBy: { createdAt: 'asc' } },
        person: { select: { id: true, name: true, email: true } },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.present(ticket);
  }

  /** The client has opened the request, so a reply from us is no longer unread. */
  async markSeenByClient(ticketId: string, personId: string) {
    // Written directly so that reading a request does not count as activity on it for the support team's list.
    await this.db.$executeRaw`UPDATE "support_tickets" SET "clientSeenAt" = NOW() WHERE "id" = ${ticketId} AND "personId" = ${personId}`;
    return { ok: true };
  }

  async replyToTicket(ticketId: string, authorId: string, authorRole: TicketAuthorRole, content: string, attachment?: TicketAttachment | null) {
    const text = (content ?? '').trim();
    if (!text && !attachment) throw new BadRequestException('Write a message or attach a file.');
    this.checkAttachment(attachment, authorId);

    const ticket = await this.db.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        person: { select: { id: true, name: true, email: true, locale: true } },
        replies: { orderBy: { createdAt: 'desc' }, take: 1, select: { authorRole: true, createdAt: true } },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const fromClient = authorRole === TicketAuthorRole.CLIENT;
    const solved = SOLVED.includes(ticket.status);
    let reopened = false;
    if (fromClient && solved) {
      const solvedAt = ticket.resolvedAt ?? ticket.updatedAt;
      if (Date.now() - solvedAt.getTime() >= REOPEN_DAYS * 86400000) {
        throw new BadRequestException('This request was solved a while ago. Please start a new one.');
      }
      reopened = true;
    }

    const reply = await this.db.ticketReply.create({
      data: {
        ticketId, authorId, authorRole, content: text,
        attachmentKey: attachment?.key ?? null,
        attachmentName: attachment ? (attachment.name || 'Attachment').slice(0, 200) : null,
        attachmentType: attachment?.type?.slice(0, 100) ?? null,
      },
    });

    // Only a reply from us moves a new request to "in progress"; the client's own follow-up does not.
    const status = reopened ? TicketStatus.OPEN
      : !fromClient && ticket.status === TicketStatus.OPEN ? TicketStatus.IN_PROGRESS
      : ticket.status;
    await this.db.supportTicket.update({
      where: { id: ticketId },
      data: {
        status,
        ...(reopened ? { resolvedAt: null } : {}),
        ...(fromClient ? { clientSeenAt: new Date() } : {}),
        updatedAt: new Date(),
      },
    });

    const summary = [text, attachment && `File: ${attachment.name}`].filter(Boolean).join('\n');
    if (fromClient) {
      const previous = ticket.replies[0];
      const justWrote = !!previous && previous.authorRole === TicketAuthorRole.CLIENT
        && Date.now() - previous.createdAt.getTime() < NOTIFY_QUIET_MINUTES * 60000;
      if (reopened || !justWrote) {
        this.events.emit('ticket.client_replied', {
          ticketId, subject: ticket.subject, content: summary, reopened,
          clientName: ticket.person?.name ?? 'A client', clientEmail: ticket.person?.email ?? null,
        });
      }
    } else {
      this.events.emit('ticket.staff_replied', {
        ticketId, subject: ticket.subject, content: summary,
        clientName: ticket.person?.name ?? null, clientEmail: ticket.person?.email ?? null, locale: ticket.person?.locale ?? 'en',
      });
    }
    return this.presentReply(reply);
  }

  /** The client says their problem is fixed. */
  async solveByClient(ticketId: string) {
    const ticket = await this.db.supportTicket.findUnique({ where: { id: ticketId }, select: { status: true } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (SOLVED.includes(ticket.status)) return { ok: true };
    await this.db.supportTicket.update({ where: { id: ticketId }, data: { status: TicketStatus.RESOLVED, resolvedAt: new Date() } });
    return { ok: true };
  }

  /** The ticket a message belongs to, for access checks. */
  async replyTicketId(replyId: string): Promise<string> {
    const reply = await this.db.ticketReply.findUnique({ where: { id: replyId }, select: { ticketId: true } });
    if (!reply) throw new NotFoundException('Message not found');
    return reply.ticketId;
  }

  /** A link to a message's file that stops working after five minutes. */
  async getAttachmentViewUrl(replyId: string) {
    const reply = await this.db.ticketReply.findUnique({ where: { id: replyId }, select: { attachmentKey: true, attachmentName: true } });
    if (!reply?.attachmentKey) throw new NotFoundException('This message has no file.');
    const url = await this.s3.getSignedUrlPromise('getObject', { Bucket: process.env.R2_BUCKET_NAME, Key: reply.attachmentKey, Expires: 300 });
    return { url, name: reply.attachmentName ?? 'Attachment' };
  }

  // Admin endpoints
  async getAllTickets(status?: TicketStatus) {
    const tickets = await this.db.supportTicket.findMany({
      where: status ? { status } : undefined,
      include: {
        person: { select: { id: true, name: true, email: true } },
        replies: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return tickets.map((t) => this.present(t));
  }

  async updateTicketStatus(ticketId: string, status: TicketStatus, assignedConsultantId?: string) {
    const before = await this.db.supportTicket.findUnique({
      where: { id: ticketId },
      select: { status: true, subject: true, person: { select: { name: true, email: true, locale: true } } },
    });
    if (!before) throw new NotFoundException('Ticket not found');
    const updated = await this.db.supportTicket.update({
      where: { id: ticketId },
      data: {
        status,
        assignedConsultantId,
        resolvedAt: status === TicketStatus.RESOLVED ? new Date() : undefined,
      },
    });
    // Tell the client once, when we close a request they had open.
    if (SOLVED.includes(status) && !SOLVED.includes(before.status)) {
      this.events.emit('ticket.resolved', {
        ticketId, subject: before.subject,
        clientName: before.person?.name ?? null, clientEmail: before.person?.email ?? null, locale: before.person?.locale ?? 'en',
      });
    }
    return updated;
  }

  async updatePriority(ticketId: string, priority: TicketPriority) {
    return this.db.supportTicket.update({ where: { id: ticketId }, data: { priority } });
  }
}
