import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConsultationController } from './consultation.controller';
import { ConsultationService } from './consultation.service';
import { ConsultationReminderProcessor } from './consultation-reminder.processor';
import { DailyCoService } from './daily-co.service';
import { RefundService } from './refund.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'consultation-reminders' }),
    NotificationModule,
  ],
  controllers: [ConsultationController],
  providers: [
    ConsultationService,
    ConsultationReminderProcessor,
    DailyCoService,
    RefundService,
  ],
  exports: [ConsultationService],
})
export class ConsultationModule {}
