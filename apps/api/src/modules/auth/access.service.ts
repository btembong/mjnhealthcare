import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@mjn/database';
import { AuthUser, isConsultant, isStaff } from './access';

export type ConsultantScope = {
  canSeeEngagement: (engagement: { consultantId?: string | null }) => boolean;
  canSeeEngagementId: (engagementId?: string | null) => boolean;
  canSeePerson: (personId?: string | null) => boolean;
};

const DENIED = 'You do not have access to this record.';

/**
 * Record-level access rules.
 * - Clients (candidates, students, partners): only their own records.
 * - Consultants: cases assigned to them, plus unassigned cases and people.
 * - Other staff: everything.
 */
@Injectable()
export class AccessService {
  constructor(private readonly db: DatabaseService) {}

  /** Engagement.consultantId holds a ConsultantProfile id; a login is matched to a profile by email. */
  async consultantIds(user: AuthUser): Promise<Set<string>> {
    const ids = new Set<string>([user.id]);
    const person = await this.db.person.findUnique({ where: { id: user.id }, select: { email: true } });
    const profiles = await this.db.consultantProfile.findMany({
      where: {
        OR: [
          { partnerUserId: user.id },
          ...(person?.email ? [{ email: { equals: person.email, mode: 'insensitive' as const } }] : []),
        ],
      },
      select: { id: true },
    });
    for (const p of profiles) ids.add(p.id);
    return ids;
  }

  /**
   * The staff login (Person id) behind a consultant, given either a ConsultantProfile id or a Person id.
   * Null when that consultant has no login to act with.
   */
  async resolveConsultantLogin(consultantId: string): Promise<string | null> {
    const direct = await this.db.person.findUnique({ where: { id: consultantId }, select: { id: true } });
    if (direct) return direct.id;
    const profile = await this.db.consultantProfile.findUnique({
      where: { id: consultantId },
      select: { email: true, partnerUserId: true },
    });
    if (!profile) return null;
    if (profile.partnerUserId) {
      const linked = await this.db.person.findUnique({ where: { id: profile.partnerUserId }, select: { id: true } });
      if (linked) return linked.id;
    }
    if (!profile.email) return null;
    const byEmail = await this.db.person.findFirst({
      where: {
        email: { equals: profile.email, mode: 'insensitive' },
        role: { in: ['CONSULTANT', 'ADMIN'] as any[] },
        isActive: true,
      },
      select: { id: true },
    });
    return byEmail?.id ?? null;
  }

  /** Returns null when the user is not restricted to their own caseload. */
  async consultantScope(user: AuthUser): Promise<ConsultantScope | null> {
    if (!isConsultant(user)) return null;
    const mine = await this.consultantIds(user);
    const engagements = await this.db.engagement.findMany({
      select: { id: true, personId: true, consultantId: true },
    });
    const visibleEngagements = new Set<string>();
    const myClients = new Set<string>();
    const othersClients = new Set<string>();
    for (const e of engagements) {
      if (!e.consultantId || mine.has(e.consultantId)) visibleEngagements.add(e.id);
      if (e.consultantId && mine.has(e.consultantId)) myClients.add(e.personId);
      else if (e.consultantId) othersClients.add(e.personId);
    }
    return {
      canSeeEngagement: (e) => !e.consultantId || mine.has(e.consultantId),
      canSeeEngagementId: (id) => !!id && visibleEngagements.has(id),
      canSeePerson: (id) => !!id && (id === user.id || myClients.has(id) || !othersClients.has(id)),
    };
  }

  async assertPerson(user: AuthUser, personId: string): Promise<void> {
    if (personId && personId === user.id) return;
    if (!isStaff(user)) throw new ForbiddenException(DENIED);
    const scope = await this.consultantScope(user);
    if (scope && !scope.canSeePerson(personId)) throw new ForbiddenException(DENIED);
  }

  async assertEngagement(user: AuthUser, engagementId: string): Promise<void> {
    if (isStaff(user) && !isConsultant(user)) return;
    const engagement = await this.db.engagement.findUnique({
      where: { id: engagementId },
      select: { personId: true, consultantId: true },
    });
    if (!engagement) throw new NotFoundException('Engagement not found.');
    if (isConsultant(user)) {
      if (!engagement.consultantId || (await this.consultantIds(user)).has(engagement.consultantId)) return;
      // A case escalated to this consultant is theirs to act on while the escalation is open.
      const escalated = await this.db.caseEscalation.count({
        where: { engagementId, consultantId: user.id, status: 'OPEN' },
      });
      if (escalated > 0) return;
    } else if (engagement.personId === user.id) {
      return;
    }
    throw new ForbiddenException(DENIED);
  }

  async assertOrder(user: AuthUser, orderId: string): Promise<void> {
    if (isStaff(user) && !isConsultant(user)) return;
    const order = await this.db.order.findUnique({
      where: { id: orderId },
      select: { personId: true, engagementId: true },
    });
    if (!order) throw new NotFoundException('Order not found.');
    if (order.engagementId) return this.assertEngagement(user, order.engagementId);
    if (order.personId) return this.assertPerson(user, order.personId);
    throw new ForbiddenException(DENIED);
  }

  async assertDocument(user: AuthUser, documentId: string): Promise<void> {
    if (isStaff(user) && !isConsultant(user)) return;
    const doc = await this.db.document.findUnique({ where: { id: documentId }, select: { personId: true } });
    if (!doc) throw new NotFoundException('Document not found.');
    return this.assertPerson(user, doc.personId);
  }

  async assertBooking(user: AuthUser, bookingId: string): Promise<void> {
    if (isStaff(user) && !isConsultant(user)) return;
    const booking = await this.db.booking.findUnique({ where: { id: bookingId }, select: { personId: true } });
    if (!booking) throw new NotFoundException('Booking not found.');
    if (booking.personId) return this.assertPerson(user, booking.personId);
    if (!isStaff(user)) throw new ForbiddenException(DENIED);
  }

  async assertTicket(user: AuthUser, ticketId: string): Promise<void> {
    if (isStaff(user)) return;
    const ticket = await this.db.supportTicket.findUnique({ where: { id: ticketId }, select: { personId: true } });
    if (!ticket) throw new NotFoundException('Ticket not found.');
    if (ticket.personId !== user.id) throw new ForbiddenException(DENIED);
  }

  async assertStudyItem(user: AuthUser, itemId: string): Promise<void> {
    if (isStaff(user) && !isConsultant(user)) return;
    const item = await this.db.studyPlanItem.findUnique({
      where: { id: itemId },
      select: { studyPlan: { select: { personId: true } } },
    });
    if (!item) throw new NotFoundException('Study plan item not found.');
    return this.assertPerson(user, item.studyPlan.personId);
  }

  async assertMilestone(user: AuthUser, milestoneId: string): Promise<void> {
    if (isStaff(user) && !isConsultant(user)) return;
    const milestone = await this.db.engagementMilestone.findUnique({
      where: { id: milestoneId },
      select: { engagementId: true },
    });
    if (!milestone) throw new NotFoundException('Milestone not found.');
    return this.assertEngagement(user, milestone.engagementId);
  }

  /** Staff, or a client asking about their own email address. */
  async assertOwnEmail(user: AuthUser, email: string): Promise<void> {
    if (isStaff(user)) return;
    const person = await this.db.person.findUnique({ where: { id: user.id }, select: { email: true } });
    if (!person?.email || person.email.toLowerCase() !== (email ?? '').toLowerCase()) {
      throw new ForbiddenException(DENIED);
    }
  }
}
