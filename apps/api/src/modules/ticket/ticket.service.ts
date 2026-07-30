import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '@mjn/database';
import { TicketCategory, TicketPriority, TicketStatus, TicketAuthorRole } from '@mjn/database';

@Injectable()
export class TicketService {
  constructor(private readonly db: DatabaseService) {}

  async createTicket(personId: string, subject: string, category: TicketCategory, content: string) {
    const ticket = await this.db.supportTicket.create({
      data: { personId, subject, category },
    });
    await this.db.ticketReply.create({
      data: { ticketId: ticket.id, authorId: personId, authorRole: TicketAuthorRole.CLIENT, content },
    });
    return this.db.supportTicket.findUnique({
      where: { id: ticket.id },
      include: { replies: true, person: { select: { id: true, name: true, email: true } } },
    });
  }

  async getMyTickets(personId: string) {
    return this.db.supportTicket.findMany({
      where: { personId },
      include: { replies: { orderBy: { createdAt: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    });
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
    return ticket;
  }

  async replyToTicket(ticketId: string, authorId: string, authorRole: TicketAuthorRole, content: string) {
    const ticket = await this.db.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    const reply = await this.db.ticketReply.create({
      data: { ticketId, authorId, authorRole, content },
    });
    await this.db.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: ticket.status === TicketStatus.OPEN ? TicketStatus.IN_PROGRESS : ticket.status,
        updatedAt: new Date(),
      },
    });
    return reply;
  }

  // Admin endpoints
  async getAllTickets(status?: TicketStatus) {
    return this.db.supportTicket.findMany({
      where: status ? { status } : undefined,
      include: {
        person: { select: { id: true, name: true, email: true } },
        replies: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async updateTicketStatus(ticketId: string, status: TicketStatus, assignedConsultantId?: string) {
    return this.db.supportTicket.update({
      where: { id: ticketId },
      data: {
        status,
        assignedConsultantId,
        resolvedAt: status === TicketStatus.RESOLVED ? new Date() : undefined,
      },
    });
  }

  async updatePriority(ticketId: string, priority: TicketPriority) {
    return this.db.supportTicket.update({ where: { id: ticketId }, data: { priority } });
  }
}
