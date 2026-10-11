import { Module } from '@nestjs/common';
import { PaymentAdminService } from './payment-admin.service';
import { PaymentAdminController } from './payment-admin.controller';
import { OrderModule } from '../order/order.module';
import { ConsultationModule } from '../consultation/consultation.module';

@Module({
  // Recording a payment runs the same steps as a payment that arrives by itself.
  imports: [OrderModule, ConsultationModule],
  controllers: [PaymentAdminController],
  providers: [PaymentAdminService],
  exports: [PaymentAdminService],
})
export class PaymentAdminModule {}
