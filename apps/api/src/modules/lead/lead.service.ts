import { Injectable, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '@mjn/database';

@Injectable()
export class LeadService {
  constructor(
    private readonly db: DatabaseService,
    private readonly events: EventEmitter2,
  ) {}

  async createLead(data: {
    name: string;
    email: string;
    phone?: string;
    profession?: string;
    destination?: string;
    serviceInterest?: string;
    notes?: string;
  }) {
    const lead = await this.db.lead.create({ data });
    this.events.emit('lead.created', {
      leadId: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      profession: lead.profession,
      destination: lead.destination,
      serviceInterest: lead.serviceInterest,
      notes: lead.notes,
      source: 'Web form',
    });
    return lead;
  }

  async findAll(filters?: { status?: string }) {
    const leads = await this.db.lead.findMany({
      where: filters?.status ? { status: filters.status as any } : undefined,
      include: { bookings: { include: { slot: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // Attach consultant names — assignedConsultantId is a raw FK string, no schema relation
    const ids = [...new Set(leads.map((l) => l.assignedConsultantId).filter(Boolean))] as string[];
    const nameMap: Record<string, string> = {};
    if (ids.length) {
      const persons = await this.db.person.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true },
      });
      persons.forEach((p) => { nameMap[p.id] = p.name; });
    }

    return leads.map((l) => ({
      ...l,
      assignedConsultantName: l.assignedConsultantId ? (nameMap[l.assignedConsultantId] ?? null) : null,
    }));
  }

  async updateStatus(id: string, status: string, assignedConsultantId?: string) {
    const lead = await this.db.lead.update({
      where: { id },
      data: { status: status as any, ...(assignedConsultantId && { assignedConsultantId }) },
    });

    if (assignedConsultantId) {
      const profile = await this.db.consultantProfile.findUnique({ where: { id: assignedConsultantId } });
      if (profile?.email) {
        this.events.emit('lead.assigned', {
          consultantEmail: profile.email,
          consultantName: profile.name,
          leadName: lead.name,
          leadEmail: lead.email,
          leadPhone: lead.phone,
          leadProfession: lead.profession,
          leadDestination: lead.destination,
          leadNotes: lead.notes,
        });
      }
    }

    return lead;
  }

  async convertToEngagement(leadId: string) {
    const lead = await this.db.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');

    // Find existing Person by email or create a new one from lead data
    const existing = await this.db.person.findFirst({ where: { email: lead.email } });
    const isNew = !existing;
    const person = existing ?? await this.db.person.create({
      data: {
        name: lead.name,
        email: lead.email,
        phone: lead.phone ?? undefined,
        profession: lead.profession ?? undefined,
        locale: 'en',
        role: 'CANDIDATE',
      },
    });

    await this.db.lead.update({
      where: { id: leadId },
      data: { status: 'CONVERTED', convertedPersonId: person.id },
    });

    // Track referral registration if lead came via a public affiliate link
    if (lead.refCode) {
      this.events.emit('referral.track_registration', { personId: person.id, refCode: lead.refCode });
    }

    this.events.emit('lead.converted', { name: lead.name, email: lead.email });

    return { personId: person.id, isNew };
  }

  // ── Stale lead detection — daily at 9:30 AM ───────────────────────────────

  @Cron('30 9 * * *')
  async detectStaleLeads() {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [newLeads, contactedLeads] = await Promise.all([
      this.db.lead.findMany({
        where: { status: 'NEW', createdAt: { lt: threeDaysAgo } },
        select: { name: true, email: true, createdAt: true },
      }),
      this.db.lead.findMany({
        where: { status: 'CONTACTED', updatedAt: { lt: sevenDaysAgo } },
        select: { name: true, email: true, updatedAt: true },
      }),
    ]);

    if (!newLeads.length && !contactedLeads.length) return;

    this.events.emit('lead.stale_alert', {
      newLeads: newLeads.map((l) => ({
        name: l.name,
        email: l.email,
        daysOld: Math.floor((now.getTime() - l.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
      })),
      contactedLeads: contactedLeads.map((l) => ({
        name: l.name,
        email: l.email,
        daysOld: Math.floor((now.getTime() - l.updatedAt.getTime()) / (24 * 60 * 60 * 1000)),
      })),
    });
  }
}
