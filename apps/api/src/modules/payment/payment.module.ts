import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { OrderModule } from '../order/order.module';
import { TranzakProvider } from './providers/tranzak.provider';
import { StripeProvider } from './providers/stripe.provider';

@Module({
  imports: [OrderModule],
  providers: [PaymentService, TranzakProvider, StripeProvider],
  controllers: [PaymentController],
  exports: [PaymentService],
})
export class PaymentModule {}
