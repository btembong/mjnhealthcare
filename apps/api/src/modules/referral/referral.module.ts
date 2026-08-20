import { Module } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { ReferralController } from './referral.controller';
import { CreditService } from './credit.service';
import { CreditController } from './credit.controller';
import { PublicReferralService } from './public-referral.service';
import { PublicReferralController } from './public-referral.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [ReferralController, CreditController, PublicReferralController],
  providers: [ReferralService, CreditService, PublicReferralService],
  exports: [ReferralService, CreditService, PublicReferralService],
})
export class ReferralModule {}
