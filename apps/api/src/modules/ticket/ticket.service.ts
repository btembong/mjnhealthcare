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

// Privacy requests (a copy of their data, deleting their account) should be answered within this long.
const PRIVACY_DUE_DAYS = 30;
const ASSIGNABLE_ROLES = ['ADMIN', 'CONSULTANT', 'PROCESSING_OFFICER'];

/** What a member of staff may see: everything, or only some clients' requests and no privacy requests. */
export type TicketScope = null | { canSeePerson: (personId: string) => boolean };

type StoredReply = {
  internal?: boolean;
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
  private present(ticket: any, forStaff = false) {
    const everything: StoredReply[] = ticket.replies ?? [];
    const visible = everything.filter((r) => !r.internal);
    // A client never receives a staff note, in any form.
    const replies = forStaff ? everything : visible;
    const last = visible.reduce<StoredReply | null>((latest, r) => (!latest || r.createdAt > latest.createdAt ? r : latest), null);
    const solved = SOLVED.includes(ticket.status);
    const fromUs = !!last && last.authorRole !== TicketAuthorRole.CLIENT;
    const solvedAt: Date | null = solved ? ticket.resolvedAt ?? ticket.updatedAt ?? null : null;
    // How long the client has been waiting: since the first thing they wrote that we have not answered.
    let waitingSince: Date | null = null;
    if (!solved && !fromUs) {
      const ordered = [...visible].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      for (let i = ordered.length - 1; i >= 0 && ordered[i].authorRole === TicketAuthorRole.CLIENT; i--) waitingSince = ordered[i].createdAt;
      waitingSince = waitingSince ?? ticket.createdAt;
    }
    return {
      ...ticket,
      waitingSince,
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

  async getTicket(ticketId: string, forStaff = false) {
    const ticket = await this.db.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        replies: { orderBy: { createdAt: 'asc' } },
        person: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (!forStaff) return this.present(ticket);

    // Staff also see who wrote each message, who owns the request, and where the client's case is.
    const authorIds = [...new Set([...ticket.replies.map((r) => r.authorId), ticket.assignedConsultantId].filter(Boolean) as string[])];
    const [people, engagement] = await Promise.all([
      authorIds.length ? this.db.person.findMany({ where: { id: { in: authorIds } }, select: { id: true, name: true } }) : [],
      this.db.engagement.findFirst({ where: { personId: ticket.personId }, orderBy: { createdAt: 'desc' }, select: { id: true } }),
    ]);
    const nameOf = new Map(people.map((p) => [p.id, p.name]));
    const shown = this.present(ticket, true);
    return {
      ...shown,
      replies: shown.replies.map((r: any) => ({ ...r, authorName: nameOf.get(r.authorId) ?? null })),
      assignedTo: ticket.assignedConsultantId ? { id: ticket.assignedConsultantId, name: nameOf.get(ticket.assignedConsultantId) ?? 'Former staff member' } : null,
      engagementId: engagement?.id ?? null,
      privacyDueAt: this.privacyDue(ticket),
    };
  }

  private privacyDue(ticket: { category: string; status: string; createdAt: Date }): Date | null {
    if (ticket.category !== TicketCategory.PRIVACY || SOLVED.includes(ticket.status)) return null;
    return new Date(ticket.createdAt.getTime() + PRIVACY_DUE_DAYS * 86400000);
  }

  /** The client has opened the request, so a reply from us is no longer unread. */
  async markSeenByClient(ticketId: string, personId: string) {
    // Written directly so that reading a request does not count as activity on it for the support team's list.
    await this.db.$executeRaw`UPDATE "support_tickets" SET "clientSeenAt" = NOW() WHERE "id" = ${ticketId} AND "personId" = ${personId}`;
    return { ok: true };
  }

  async replyToTicket(
    ticketId: string, authorId: string, authorRole: TicketAuthorRole, content: string, attachment?: TicketAttachment | null,
    options: { internal?: boolean; solve?: boolean } = {},
  ) {
    const text = (content ?? '').trim();
    if (!text && !attachment) throw new BadRequestException('Write a message or attach a file.');
    this.checkAttachment(attachment, authorId);

    // A note for staff: saved in the conversation, and nothing else happens. The client is not
    // told, the request does not change hands, and it stays whoever's turn it was.
    if (options.internal) {
      if (authorRole === TicketAuthorRole.CLIENT) throw new BadRequestException('Only staff can add a note.');
      const exists = await this.db.supportTicket.findUnique({ where: { id: ticketId }, select: { id: true } });
      if (!exists) throw new NotFoundException('Ticket not found');
      const note = await this.db.ticketReply.create({
        data: {
          ticketId, authorId, authorRole, content: text, internal: true,
          attachmentKey: attachment?.key ?? null,
          attachmentName: attachment ? (attachment.name || 'Attachment').slice(0, 200) : null,
          attachmentType: attachment?.type?.slice(0, 100) ?? null,
        },
      });
      return this.presentReply(note);
    }

    const ticket = await this.db.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        person: { select: { id: true, name: true, email: true, locale: true } },
        replies: { where: { internal: false }, orderBy: { createdAt: 'desc' }, take: 1, select: { authorRole: true, createdAt: true } },
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
    const solving = !fromClient && options.solve === true;
    const status = solving ? TicketStatus.RESOLVED
      : reopened ? TicketStatus.OPEN
      : !fromClient && ticket.status === TicketStatus.OPEN ? TicketStatus.IN_PROGRESS
      : ticket.status;
    await this.db.supportTicket.update({
      where: { id: ticketId },
      data: {
        status,
        ...(solving ? { resolvedAt: new Date() } : {}),
        // Whoever answers a request nobody owns becomes its owner.
        ...(!fromClient && !ticket.assignedConsultantId ? { assignedConsultantId: authorId } : {}),
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
          assigneeId: ticket.assignedConsultantId ?? null,
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

  /** A link to a message's file that stops working after five minutes. Staff notes open for staff only. */
  async getAttachmentViewUrl(replyId: string, forStaff = false) {
    const reply = await this.db.ticketReply.findUnique({ where: { id: replyId }, select: { attachmentKey: true, attachmentName: true, internal: true } });
    if (!reply?.attachmentKey || (reply.internal && !forStaff)) throw new NotFoundException('This message has no file.');
    const url = await this.s3.getSignedUrlPromise('getObject', { Bucket: process.env.R2_BUCKET_NAME, Key: reply.attachmentKey, Expires: 300 });
    return { url, name: reply.attachmentName ?? 'Attachment' };
  }

  // ── Staff ──────────────────────────────────────────────────────────────────

  /** The staff inbox: every request this person may see, with whose turn it is and how long the client has waited. */
  async listForStaff(scope: TicketScope) {
    const tickets = await this.db.supportTicket.findMany({
      where: scope ? { category: { not: TicketCategory.PRIVACY } } : undefined,
      include: {
        person: { select: { id: true, name: true, email: true } },
        replies: { select: { authorRole: true, createdAt: true, internal: true, content: true, attachmentKey: true, attachmentName: true, attachmentType: true } },
      },
    });
    const mine = scope ? tickets.filter((t) => scope.canSeePerson(t.personId)) : tickets;
    const staffIds = [...new Set(mine.map((t) => t.assignedConsultantId).filter(Boolean) as string[])];
    const staff = staffIds.length ? await this.db.person.findMany({ where: { id: { in: staffIds } }, select: { id: true, name: true } }) : [];
    const nameOf = new Map(staff.map((s) => [s.id, s.name]));

    return mine.map((t) => {
      const shown = this.present(t, true);
      const lastVisible = [...t.replies].filter((r) => !r.internal).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      return {
        id: t.id,
        subject: t.subject,
        category: t.category,
        urgent: t.urgent,
        turn: shown.turn as 'us' | 'client' | 'solved',
        waitingSince: shown.waitingSince as Date | null,
        lastActivityAt: shown.lastActivityAt as Date,
        createdAt: t.createdAt,
        person: t.person,
        assignedTo: t.assignedConsultantId ? { id: t.assignedConsultantId, name: nameOf.get(t.assignedConsultantId) ?? 'Former staff member' } : null,
        preview: (lastVisible?.content || (lastVisible?.attachmentName ? `File: ${lastVisible.attachmentName}` : '')).slice(0, 140),
        notes: t.replies.filter((r) => r.internal).length,
        privacyDueAt: this.privacyDue(t),
      };
    });
  }

  /** Who a request can be given to. */
  async assignableStaff() {
    return this.db.person.findMany({
      where: { role: { in: ASSIGNABLE_ROLES as any[] }, isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });
  }

  async assign(ticketId: string, staffId: string | null) {
    if (staffId) {
      const staff = await this.db.person.findUnique({ where: { id: staffId }, select: { role: true, isActive: true } });
      if (!staff || !staff.isActive || !ASSIGNABLE_ROLES.includes(staff.role as string)) {
        throw new BadRequestException('Choose an active member of staff.');
      }
    }
    await this.db.supportTicket.update({ where: { id: ticketId }, data: { assignedConsultantId: staffId } });
    return { assignedTo: staffId };
  }

  async setUrgent(ticketId: string, urgent: boolean) {
    await this.db.supportTicket.update({ where: { id: ticketId }, data: { urgent, priority: urgent ? TicketPriority.HIGH : TicketPriority.MEDIUM } });
    return { urgent };
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
        // Reopening clears the solved date, so the 14-day reply window starts again next time.
        resolvedAt: SOLVED.includes(status) ? (SOLVED.includes(before.status) ? undefined : new Date()) : null,
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
