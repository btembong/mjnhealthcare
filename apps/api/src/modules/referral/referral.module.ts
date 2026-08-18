import { Module } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { ReferralController } from './referral.controller';
import { CreditService } from './credit.service';
import { CreditController } from './credit.controller';

@Module({
  controllers: [ReferralController, CreditController],
  providers: [ReferralService, CreditService],
  exports: [ReferralService, CreditService],
})
export class ReferralModule {}
