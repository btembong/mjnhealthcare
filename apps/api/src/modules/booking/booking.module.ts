import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { BookingReminderProcessor } from './booking-reminder.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'booking-reminders' })],
  providers: [BookingService, BookingReminderProcessor],
  controllers: [BookingController],
  exports: [BookingService],
})
export class BookingModule {}
