import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationListener } from './notification.listener';
import { OrderModule } from '../order/order.module';

// DatabaseService is globally provided via DatabaseModule (app.module.ts)
@Module({
  imports: [OrderModule],
  providers: [NotificationService, NotificationListener],
  exports: [NotificationService],
})
export class NotificationModule {}
