import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@mjn/database';

@Injectable()
export class ComplianceService {
  constructor(private readonly db: DatabaseService) {}

  async logAuditEvent(data: {
    actorId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.db.auditLog.create({ data: data as any });
  }

  async getAuditLog(filters?: { resourceType?: string; resourceId?: string }) {
    return this.db.auditLog.findMany({
      where: {
        ...(filters?.resourceType ? { resourceType: filters.resourceType } : {}),
        ...(filters?.resourceId ? { resourceId: filters.resourceId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async recordConsent(personId: string, type: string, ipAddress: string) {
    return this.db.consentRecord.create({
      data: { personId, type, ipAddress, recordedAt: new Date() },
    });
  }

  async recordPoa(engagementId: string, personId: string, documentUrl: string) {
    return this.db.poaRecord.create({
      data: { engagementId, personId, documentUrl, capturedAt: new Date() },
    });
  }
}
