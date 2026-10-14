import { Module } from '@nestjs/common';
import { PaymentAdminService } from './payment-admin.service';
import { PaymentAdminController } from './payment-admin.controller';
import { OrderModule } from '../order/order.module';
import { ConsultationModule } from '../consultation/consultation.module';
import { PaymentModule } from '../payment/payment.module';
import { PaymentSweepService } from './payment-sweep.service';
import { ManualPaymentService } from './manual-payment.service';

@Module({
  // Recording a payment runs the same steps as a payment that arrives by itself.
  imports: [OrderModule, ConsultationModule, PaymentModule],
  controllers: [PaymentAdminController],
  providers: [PaymentAdminService, PaymentSweepService, ManualPaymentService],
  exports: [PaymentAdminService],
})
export class PaymentAdminModule {}
