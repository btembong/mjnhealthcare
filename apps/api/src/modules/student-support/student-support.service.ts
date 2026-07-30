import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '@mjn/database';

@Injectable()
export class StudentSupportService {
  constructor(
    private readonly db: DatabaseService,
    private readonly events: EventEmitter2,
  ) {}

  // ── Internships (candidate) ───────────────────────────────────────────────

  async getInternships(filters?: { country?: string; field?: string }) {
    return this.db.internshipPlacement.findMany({
      where: {
        status: 'OPEN',
        ...(filters?.country ? { country: filters.country } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInternshipById(id: string) {
    const internship = await this.db.internshipPlacement.findUnique({ where: { id } });
    if (!internship) throw new NotFoundException('Internship not found');
    return internship;
  }

  async applyForInternship(personId: string, internshipId: string) {
    const existing = await this.db.internshipApplication.findFirst({ where: { personId, internshipId } });
    if (existing) return existing;
    const application = await this.db.internshipApplication.create({
      data: { personId, internshipId, status: 'SUBMITTED' },
    });
    this.events.emit('application.submitted', { type: 'internship', applicationId: application.id, personId, internshipId });
    return application;
  }

  async getInternshipApplicationsByPerson(personId: string) {
    return this.db.internshipApplication.findMany({
      where: { personId },
      include: { internship: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── University Programs (candidate) ───────────────────────────────────────

  async getUniversityPrograms(filters?: { country?: string; field?: string }) {
    return this.db.universityProgram.findMany({
      where: {
        ...(filters?.country ? { country: filters.country } : {}),
        ...(filters?.field ? { field: filters.field } : {}),
      },
      orderBy: [{ country: 'asc' }, { name: 'asc' }],
    });
  }

  // ── WES / Evaluation tracking ─────────────────────────────────────────────

  async getWesApplicationsByPerson(personId: string) {
    return (this.db as any).wesApplication?.findMany({
      where: { personId },
      orderBy: { createdAt: 'desc' },
    }) ?? [];
  }

  async createWesApplication(data: { personId: string; engagementId?: string; credentialCount: number; isRush?: boolean }) {
    const record = await (this.db as any).wesApplication?.create({
      data: {
        ...data,
        status: 'SUBMITTED',
        isRush: data.isRush ?? false,
        credentialCount: data.credentialCount ?? 1,
      },
    });
    this.events.emit('student.wes_submitted', { personId: data.personId, applicationId: record?.id });
    return record;
  }

  // ── Admin: Internship CRUD ────────────────────────────────────────────────

  async createInternship(data: {
    title: string;
    country: string;
    field?: string;
    description?: string;
    duration?: string;
    stipend?: string;
    closingDate?: Date;
  }) {
    return this.db.internshipPlacement.create({ data: { ...data, status: 'OPEN' } });
  }

  async updateInternship(id: string, data: Partial<{ title: string; description: string; status: string; closingDate: Date }>) {
    return this.db.internshipPlacement.update({ where: { id }, data });
  }

  async getAllInternshipApplications(filters?: { status?: string }) {
    return this.db.internshipApplication.findMany({
      where: filters?.status ? { status: filters.status } : {},
      include: {
        person: { select: { id: true, name: true, email: true } },
        internship: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateInternshipApplicationStatus(id: string, status: string, notes?: string) {
    return this.db.internshipApplication.update({
      where: { id },
      data: { status, ...(notes ? { notes } : {}) },
      include: { person: { select: { id: true, name: true, email: true } }, internship: true },
    });
  }

  // ── Admin: University Program CRUD ────────────────────────────────────────

  async createUniversityProgram(data: {
    name: string;
    university: string;
    country: string;
    field?: string;
    duration?: string;
    tuitionUsd?: number;
    applicationUrl?: string;
    description?: string;
  }) {
    return this.db.universityProgram.create({ data });
  }

  async updateUniversityProgram(id: string, data: Partial<{ name: string; description: string; tuitionUsd: number; applicationUrl: string }>) {
    return this.db.universityProgram.update({ where: { id }, data });
  }
}
