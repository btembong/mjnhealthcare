import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '@mjn/database';

const REMINDER_LEAD_MINUTES = 30;

@Injectable()
export class BookingService {
  constructor(
    private readonly db: DatabaseService,
    private readonly events: EventEmitter2,
    @InjectQueue('booking-reminders') private readonly reminderQueue: Queue,
  ) {}

  async getAvailableSlots(resourceId: string, date: string) {
    return this.db.bookingSlot.findMany({
      where: { resourceId, date: new Date(date), isBooked: false },
      orderBy: { startTime: 'asc' },
    });
  }

  async createSlots(data: {
    resourceId: string;
    slots: { date: string; startTime: string; endTime: string }[];
  }) {
    return this.db.bookingSlot.createMany({
      data: data.slots.map((s) => ({
        resourceId: data.resourceId,
        date: new Date(s.date),
        startTime: new Date(s.startTime),
        endTime: new Date(s.endTime),
        isBooked: false,
      })),
    });
  }

  async createBooking(personId: string, slotId: string, type: string) {
    const slot = await this.db.bookingSlot.findUniqueOrThrow({ where: { id: slotId } });

    const booking = await this.db.booking.create({
      data: { personId: personId, slotId, type, status: 'CONFIRMED' },
    });
    await this.db.bookingSlot.update({ where: { id: slotId }, data: { isBooked: true } });
    this.events.emit('booking.created', { bookingId: booking.id, personId });

    // Schedule a reminder 30 minutes before the session
    const reminderAt = new Date(slot.startTime.getTime() - REMINDER_LEAD_MINUTES * 60 * 1000);
    const delay = Math.max(0, reminderAt.getTime() - Date.now());
    if (delay > 0) {
      await this.reminderQueue.add(
        'send-reminder',
        { bookingId: booking.id, personId, slotStart: slot.startTime.toISOString(), type },
        { delay },
      );
    }

    return booking;
  }

  async cancelBooking(bookingId: string) {
    const booking = await this.db.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    });
    await this.db.bookingSlot.update({ where: { id: booking.slotId }, data: { isBooked: false } });
    return booking;
  }

  async getBookingsByPerson(personId: string) {
    return this.db.booking.findMany({
      where: { personId },
      include: { slot: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllBookings() {
    return this.db.booking.findMany({
      include: {
        slot: true,
        person: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
