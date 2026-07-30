import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@mjn/database';

@Injectable()
export class PartnerService {
  constructor(private readonly db: DatabaseService) {}

  async getPartners(status?: string) {
    return this.db.partner.findMany({
      where: status ? { verificationStatus: status as any } : undefined,
    });
  }

  async createPartner(data: { name: string; type: string; contactEmail: string }) {
    return this.db.partner.create({ data: { ...data, verificationStatus: 'PENDING' } as any });
  }

  async verify(partnerId: string, verifiedBy: string) {
    return this.db.partner.update({
      where: { id: partnerId },
      data: { verificationStatus: 'VERIFIED' as any, verifiedBy, verifiedAt: new Date() },
    });
  }

  async postOpportunity(partnerId: string, data: { title: string; country: string; profession: string; details: string }) {
    return this.db.opportunity.create({
      data: { ...data, partnerId, status: 'ACTIVE', type: 'JOB' } as any,
    });
  }
}
