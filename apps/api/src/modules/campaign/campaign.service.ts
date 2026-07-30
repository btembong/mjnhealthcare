import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import * as Brevo from '@getbrevo/brevo';
import { DatabaseService } from '@mjn/database';
import { CampaignStatus } from '@mjn/database';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);
  private readonly emailCampaignsApi: Brevo.EmailCampaignsApi;

  constructor(private readonly db: DatabaseService) {
    this.emailCampaignsApi = new Brevo.EmailCampaignsApi();
    this.emailCampaignsApi.setApiKey(
      Brevo.EmailCampaignsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY ?? '',
    );
  }

  async createCampaign(data: {
    name: string;
    subject: string;
    body: string;
    audienceFilter?: Record<string, any>;
    scheduledAt?: Date;
    createdById: string;
  }) {
    // Persist draft in DB
    const campaign = await this.db.campaign.create({
      data: {
        name: data.name,
        subject: data.subject,
        body: data.body,
        audienceFilter: data.audienceFilter ?? {},
        status: CampaignStatus.DRAFT,
        scheduledAt: data.scheduledAt,
        createdById: data.createdById,
      },
    });

    try {
      // Create in Brevo
      const senderListId = parseInt(process.env.BREVO_LIST_ID ?? '1', 10);
      const brevoPayload = {
        name: data.name,
        subject: data.subject,
        htmlContent: data.body,
        sender: {
          email: process.env.BREVO_FROM_EMAIL ?? 'hello@mjnhealth.com',
          name: process.env.BREVO_FROM_NAME ?? 'MJN Health',
        },
        recipients: { listIds: [senderListId] },
        scheduledAt: data.scheduledAt?.toISOString(),
      };
      const response = await this.emailCampaignsApi.createEmailCampaign(brevoPayload as any);
      const brevoId = (response.body as any)?.id;
      await this.db.campaign.update({
        where: { id: campaign.id },
        data: { brevoId, status: data.scheduledAt ? CampaignStatus.SCHEDULED : CampaignStatus.DRAFT },
      });
    } catch (err) {
      this.logger.warn(`Brevo campaign create failed (saved as draft): ${err}`);
    }

    return this.db.campaign.findUnique({ where: { id: campaign.id } });
  }

  async listCampaigns(status?: CampaignStatus) {
    return this.db.campaign.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCampaign(id: string) {
    const c = await this.db.campaign.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Campaign not found');
    return c;
  }

  async sendNow(id: string) {
    const campaign = await this.db.campaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.status === CampaignStatus.SENT) throw new BadRequestException('Already sent');

    if (campaign.brevoId) {
      try {
        await this.emailCampaignsApi.sendEmailCampaignNow(campaign.brevoId);
      } catch (err) {
        this.logger.error(`Failed to send Brevo campaign ${campaign.brevoId}: ${err}`);
        throw new BadRequestException('Failed to send via Brevo: ' + err);
      }
    }

    return this.db.campaign.update({
      where: { id },
      data: { status: CampaignStatus.SENT, sentAt: new Date() },
    });
  }

  async updateCampaign(id: string, data: { name?: string; subject?: string; body?: string; scheduledAt?: Date }) {
    const campaign = await this.db.campaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.status === CampaignStatus.SENT) throw new BadRequestException('Cannot edit a sent campaign');
    return this.db.campaign.update({ where: { id }, data });
  }

  async cancelCampaign(id: string) {
    const campaign = await this.db.campaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return this.db.campaign.update({ where: { id }, data: { status: CampaignStatus.CANCELLED } });
  }
}
