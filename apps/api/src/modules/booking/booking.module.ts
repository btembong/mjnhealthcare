import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { BookingReminderProcessor } from './booking-reminder.processor';
import { FreeConsultService } from './free-consult.service';
import { DailyCoService } from '../consultation/daily-co.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'booking-reminders' })],
  providers: [BookingService, BookingReminderProcessor, FreeConsultService, DailyCoService],
  controllers: [BookingController],
  exports: [BookingService],
})
export class BookingModule {}
