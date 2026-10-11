import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '@mjn/database';

type FreeConsultReminderJob = {
  bookingId?: string;
  leadName: string; leadEmail: string; leadPhone?: string;
  consultantName?: string; consultantEmail?: string;
  slotStart: string;
  roomUrl?: string; hostUrl?: string;
};

@Processor('booking-reminders')
export class BookingReminderProcessor {
  constructor(
    private readonly events: EventEmitter2,
    private readonly db: DatabaseService,
  ) {}

  /**
   * A reminder is only sent if the booking is still on at the time it was queued for.
   * Cancelled or moved bookings leave old reminders behind in the queue; they stop here.
   * Reminders queued before bookings carried an id are sent as before.
   */
  private async stillOn(data: FreeConsultReminderJob): Promise<boolean> {
    if (!data.bookingId) return true;
    const booking = await this.db.booking.findUnique({
      where: { id: data.bookingId },
      select: { status: true, noShowAt: true, slot: { select: { startTime: true } } },
    });
    return !!booking
      && booking.status === 'CONFIRMED'
      && !booking.noShowAt
      && booking.slot.startTime.getTime() === new Date(data.slotStart).getTime();
  }

  @Process('send-reminder')
  async handleReminder(job: Job<{ bookingId: string; personId: string; slotStart: string; type: string }>) {
    this.events.emit('booking.reminder_due', job.data);
  }

  @Process('free-consult-reminder-24h')
  async handleFreeConsult24h(job: Job<FreeConsultReminderJob>) {
    if (await this.stillOn(job.data)) this.events.emit('free.consult.reminder', { ...job.data, timeLabel: '24 hours' });
  }

  @Process('free-consult-reminder-1h')
  async handleFreeConsult1h(job: Job<FreeConsultReminderJob>) {
    if (await this.stillOn(job.data)) this.events.emit('free.consult.reminder', { ...job.data, timeLabel: '1 hour' });
  }

  @Process('free-consult-reminder-15m')
  async handleFreeConsult15m(job: Job<FreeConsultReminderJob>) {
    if (await this.stillOn(job.data)) this.events.emit('free.consult.reminder', { ...job.data, timeLabel: '15 minutes' });
  }
}
