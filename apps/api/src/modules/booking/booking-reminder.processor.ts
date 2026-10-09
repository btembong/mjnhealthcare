import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';

type FreeConsultReminderJob = {
  leadName: string; leadEmail: string; leadPhone?: string;
  consultantName?: string; consultantEmail?: string;
  slotStart: string;
  roomUrl?: string; hostUrl?: string;
};

@Processor('booking-reminders')
export class BookingReminderProcessor {
  constructor(private readonly events: EventEmitter2) {}

  @Process('send-reminder')
  async handleReminder(job: Job<{ bookingId: string; personId: string; slotStart: string; type: string }>) {
    this.events.emit('booking.reminder_due', job.data);
  }

  @Process('free-consult-reminder-24h')
  async handleFreeConsult24h(job: Job<FreeConsultReminderJob>) {
    this.events.emit('free.consult.reminder', { ...job.data, timeLabel: '24 hours' });
  }

  @Process('free-consult-reminder-1h')
  async handleFreeConsult1h(job: Job<FreeConsultReminderJob>) {
    this.events.emit('free.consult.reminder', { ...job.data, timeLabel: '1 hour' });
  }

  @Process('free-consult-reminder-15m')
  async handleFreeConsult15m(job: Job<FreeConsultReminderJob>) {
    this.events.emit('free.consult.reminder', { ...job.data, timeLabel: '15 minutes' });
  }
}
