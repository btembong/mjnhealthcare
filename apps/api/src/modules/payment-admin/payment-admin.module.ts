import { Module } from '@nestjs/common';
import { PaymentAdminService } from './payment-admin.service';
import { PaymentAdminController } from './payment-admin.controller';

@Module({
  controllers: [PaymentAdminController],
  providers: [PaymentAdminService],
})
export class PaymentAdminModule {}
