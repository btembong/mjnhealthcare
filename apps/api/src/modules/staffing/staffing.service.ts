import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '@mjn/database';

@Injectable()
export class StaffingService {
  constructor(
    private readonly db: DatabaseService,
    private readonly events: EventEmitter2,
  ) {}

  // ── Opportunities (public/candidate) ─────────────────────────────────────

  async getOpportunities(filters?: { country?: string; profession?: string; partnerId?: string }) {
    return this.db.opportunity.findMany({
      where: {
        status: 'ACTIVE',
        ...(filters?.country ? { country: filters.country } : {}),
        ...(filters?.profession ? { profession: filters.profession } : {}),
        ...(filters?.partnerId ? { partnerId: filters.partnerId } : {}),
      },
      include: { partner: { select: { id: true, name: true, type: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOpportunityById(id: string) {
    const opp = await this.db.opportunity.findUnique({
      where: { id },
      include: { partner: true, applications: { include: { person: { select: { id: true, name: true, email: true } } } } },
    });
    if (!opp) throw new NotFoundException('Opportunity not found');
    return opp;
  }

  async applyToOpportunity(personId: string, opportunityId: string) {
    const existing = await this.db.application.findFirst({ where: { personId, opportunityId } });
    if (existing) return existing;
    const application = await this.db.application.create({
      data: { personId, opportunityId, status: 'SUBMITTED' },
      include: { opportunity: { include: { partner: true } }, person: { select: { id: true, name: true, email: true } } },
    });
    this.events.emit('application.submitted', { applicationId: application.id, personId, opportunityId });
    return application;
  }

  async getApplicationsByPerson(personId: string) {
    return this.db.application.findMany({
      where: { personId },
      include: { opportunity: { include: { partner: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Admin: Opportunities CRUD ─────────────────────────────────────────────

  async createOpportunity(data: {
    partnerId: string;
    title: string;
    country: string;
    profession?: string;
    type: string;
    description?: string;
    requirements?: string;
    salaryRange?: string;
    closingDate?: Date;
  }) {
    return this.db.opportunity.create({
      data: { ...data, status: 'ACTIVE' } as any,
      include: { partner: true },
    });
  }

  async updateOpportunity(id: string, data: Partial<{
    title: string; description: string; requirements: string;
    salaryRange: string; status: string; closingDate: Date;
  }>) {
    return this.db.opportunity.update({ where: { id }, data: data as any, include: { partner: true } });
  }

  async deleteOpportunity(id: string) {
    return this.db.opportunity.delete({ where: { id } });
  }

  // ── Admin: Application management ─────────────────────────────────────────

  async getAllApplications(filters?: { status?: string; opportunityId?: string }) {
    return this.db.application.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.opportunityId ? { opportunityId: filters.opportunityId } : {}),
      },
      include: {
        person: { select: { id: true, name: true, email: true, profession: true } },
        opportunity: { include: { partner: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateApplicationStatus(
    applicationId: string,
    status: 'SUBMITTED' | 'SHORTLISTED' | 'INTERVIEW' | 'OFFERED' | 'REJECTED' | 'WITHDRAWN',
    notes?: string,
  ) {
    const updated = await this.db.application.update({
      where: { id: applicationId },
      data: { status, ...(notes ? { notes } : {}) },
      include: { person: { select: { id: true, name: true, email: true, phone: true } }, opportunity: { select: { id: true, title: true, country: true } } },
    });
    this.events.emit('application.status_changed', {
      applicationId,
      status,
      notes,
      personId: updated.person.id,
      personName: updated.person.name,
      personEmail: updated.person.email,
      personPhone: (updated.person as any).phone,
      opportunityTitle: updated.opportunity?.title,
      opportunityCountry: updated.opportunity?.country,
    });
    return updated;
  }

  async markDeployed(personId: string, opportunityId: string) {
    await this.db.application.updateMany({
      where: { personId, opportunityId },
      data: { status: 'DEPLOYED' as any },
    });
    this.events.emit('candidate.deployed', { personId, opportunityId });
    return { message: 'Candidate marked as deployed' };
  }
}
