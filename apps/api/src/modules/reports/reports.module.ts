import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportOverviewService } from './report-overview.service';
import { PaymentAdminModule } from '../payment-admin/payment-admin.module';
import { EngagementModule } from '../engagement/engagement.module';

@Module({
  // Money is counted by the Payments page's own code, and cases by the Caseload page's, so the pages agree.
  imports: [PaymentAdminModule, EngagementModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReportOverviewService],
})
export class ReportsModule {}
