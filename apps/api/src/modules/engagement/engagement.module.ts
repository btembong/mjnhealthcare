import { Module } from '@nestjs/common';
import { EngagementService } from './engagement.service';
import { EngagementController } from './engagement.controller';
import { EngagementOverviewService } from './engagement-overview.service';
import { EngagementClientViewService } from './engagement-client-view.service';

@Module({
  providers: [EngagementService, EngagementOverviewService, EngagementClientViewService],
  controllers: [EngagementController],
  exports: [EngagementService, EngagementOverviewService],
})
export class EngagementModule {}
