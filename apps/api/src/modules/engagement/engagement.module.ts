import { Module } from '@nestjs/common';
import { EngagementService } from './engagement.service';
import { EngagementController } from './engagement.controller';
import { EngagementOverviewService } from './engagement-overview.service';

@Module({
  providers: [EngagementService, EngagementOverviewService],
  controllers: [EngagementController],
  exports: [EngagementService],
})
export class EngagementModule {}
