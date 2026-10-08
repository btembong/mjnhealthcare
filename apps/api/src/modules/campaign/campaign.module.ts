import { Module } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CampaignController, EmailUnsubscribeController } from './campaign.controller';

@Module({
  providers: [CampaignService],
  controllers: [CampaignController, EmailUnsubscribeController],
  exports: [CampaignService],
})
export class CampaignModule {}
