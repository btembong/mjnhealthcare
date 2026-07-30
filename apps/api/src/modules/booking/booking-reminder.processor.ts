import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Processor('booking-reminders')
export class BookingReminderProcessor {
  constructor(private readonly events: EventEmitter2) {}

  @Process('send-reminder')
  async handleReminder(job: Job<{ bookingId: string; personId: string; slotStart: string; type: string }>) {
    this.events.emit('booking.reminder_due', job.data);
  }
}
