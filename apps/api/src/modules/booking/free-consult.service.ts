import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '@mjn/database';
import { AuthUser, isAdmin, isConsultant } from '../auth/access';
import { AccessService } from '../auth/access.service';
import { DailyCoService } from '../consultation/daily-co.service';
import { DATE_RE, TIME_RE, addDays, doualaDate, doualaToUtc, weekdayOf } from '../../common/douala-time';

export const FREE_CONSULT_RESOURCE = 'general-consultation';
/** A removed time that still has booking history attached, so the row cannot be deleted. */
const RETIRED_RESOURCE = 'general-consultation-removed';
const SLOT_MINUTES = 30;
const ROOM_MINUTES = 15;
const HISTORY_DAYS = 90;
const MAX_WEEKS = 8;
const MAX_TIMES_PER_DAY = 24;

export type SlotPlanInput = { consultantId: string; startDate: string; weeks: number; weekdays: number[]; times: string[] };

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) => aStart < bEnd && aEnd > bStart;

/** Guest link that issues a fresh entry pass each time it is opened. */
export function freeConsultGuestLink(bookingId: string, email: string): string {
  const base = process.env.API_URL ?? 'http://localhost:3000';
  return `${base}/api/v1/leads/free-consult/join?bookingId=${bookingId}&email=${encodeURIComponent(email)}`;
}

@Injectable()
export class FreeConsultService {
  private readonly logger = new Logger(FreeConsultService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly access: AccessService,
    private readonly events: EventEmitter2,
    private readonly dailyCo: DailyCoService,
    @InjectQueue('booking-reminders') private readonly reminderQueue: Queue,
  ) {}

  // ── Who may manage what ─────────────────────────────────────────────────────

  /** Null = everyone's (admins). Otherwise the consultant profiles this login owns. */
  private async scope(user: AuthUser): Promise<Set<string> | null> {
    if (isAdmin(user)) return null;
    if (!isConsultant(user)) throw new ForbiddenException('Free consultations are managed by admins and consultants.');
    return this.access.consultantIds(user);
  }

  private assertAllowed(mine: Set<string> | null, consultantId?: string | null) {
    if (mine && !(consultantId && mine.has(consultantId))) {
      throw new ForbiddenException('This belongs to another consultant.');
    }
  }

  private async loadBooking(user: AuthUser, bookingId: string) {
    const mine = await this.scope(user);
    const booking = await this.db.booking.findUnique({
      where: { id: bookingId },
      include: {
        slot: { include: { consultant: { select: { id: true, name: true, email: true } } } },
        lead: true,
        person: { select: { id: true, name: true, email: true, phone: true, profession: true, locale: true } },
      },
    });
    if (!booking || ![FREE_CONSULT_RESOURCE, RETIRED_RESOURCE].includes(booking.slot.resourceId)) {
      throw new NotFoundException('Booking not found.');
    }
    this.assertAllowed(mine, booking.slot.consultantId);
    return { booking, mine };
  }

  /** The person behind a booking: a signed-in client, or a website visitor (lead). */
  private contact(booking: any) {
    const who = booking.person ?? booking.lead ?? {};
    const french = booking.person
      ? booking.person.locale === 'fr'
      : /Language preference:\s*fr/i.test(booking.lead?.notes ?? '');
    return {
      name: (who.name as string) ?? 'Guest',
      email: (who.email as string) ?? '',
      phone: (who.phone as string | null) ?? null,
      locale: french ? 'fr' : 'en',
    };
  }

  // ── Bookings ────────────────────────────────────────────────────────────────

  async overview(user: AuthUser) {
    const mine = await this.scope(user);
    const byConsultant = mine ? { consultantId: { in: [...mine] } } : {};
    const now = new Date();
    const since = new Date(now.getTime() - HISTORY_DAYS * 86400000);

    const [consultants, bookings, open] = await Promise.all([
      this.db.consultantProfile.findMany({
        where: mine ? { id: { in: [...mine] } } : { isActive: true },
        select: { id: true, name: true, specialty: true },
        orderBy: { name: 'asc' },
      }),
      this.db.booking.findMany({
        where: {
          slot: { resourceId: { in: [FREE_CONSULT_RESOURCE, RETIRED_RESOURCE] }, startTime: { gte: since }, ...byConsultant },
        },
        include: {
          slot: { include: { consultant: { select: { id: true, name: true } } } },
          lead: true,
          person: { select: { id: true, name: true, email: true, phone: true, profession: true } },
        },
        orderBy: { slot: { startTime: 'asc' } },
      }),
      this.db.bookingSlot.findMany({
        where: { resourceId: FREE_CONSULT_RESOURCE, isBooked: false, startTime: { gt: now }, ...byConsultant },
        select: { id: true, startTime: true, consultantId: true },
        orderBy: { startTime: 'asc' },
      }),
    ]);

    return {
      canManageAll: !mine,
      consultants,
      openTimes: open.map((s) => ({ id: s.id, start: s.startTime, consultantId: s.consultantId })),
      bookings: bookings.map((b: any) => {
        const who = b.person ?? b.lead ?? {};
        return {
          id: b.id,
          status: b.status,
          missed: !!b.noShowAt,
          cancelReason: b.cancelReason ?? null,
          start: b.slot.startTime,
          end: b.slot.endTime,
          consultantId: b.slot.consultantId,
          consultantName: b.slot.consultant?.name ?? null,
          name: who.name ?? 'Guest',
          email: who.email ?? '',
          phone: who.phone ?? null,
          profession: who.profession ?? null,
          destination: b.lead?.destination ?? null,
          serviceInterest: b.lead?.serviceInterest ?? null,
          notes: b.lead?.notes ?? null,
          leadId: b.leadId ?? null,
          leadStatus: b.lead?.status ?? null,
          personId: b.personId ?? null,
          bookedAt: b.createdAt,
        };
      }),
    };
  }

  // ── Availability ────────────────────────────────────────────────────────────

  /** One consultant's week: their free times, plus anything else already in their diary. */
  async week(user: AuthUser, consultantId: string, from: string) {
    const mine = await this.scope(user);
    this.assertAllowed(mine, consultantId);
    if (!consultantId) throw new BadRequestException('Choose a consultant.');
    if (!DATE_RE.test(from ?? '')) throw new BadRequestException('Choose a week.');
    const start = doualaToUtc(from);
    const end = doualaToUtc(addDays(from, 7));

    const [slots, busy] = await Promise.all([
      this.db.bookingSlot.findMany({
        where: { resourceId: FREE_CONSULT_RESOURCE, consultantId, startTime: { gte: start, lt: end } },
        include: {
          bookings: {
            where: { status: { not: 'CANCELLED' } },
            select: { id: true, lead: { select: { name: true } }, person: { select: { name: true } } },
          },
        },
        orderBy: { startTime: 'asc' },
      }),
      this.diary(consultantId, start, end),
    ]);

    return {
      slots: slots.map((s: any) => ({
        id: s.id,
        start: s.startTime,
        end: s.endTime,
        booked: s.isBooked,
        bookingId: s.isBooked ? s.bookings[0]?.id ?? null : null,
        bookedBy: s.isBooked ? s.bookings[0]?.person?.name ?? s.bookings[0]?.lead?.name ?? null : null,
      })),
      busy: busy.map((b) => ({ start: new Date(b.start), end: new Date(b.end), kind: b.kind })),
    };
  }

  /** Paid-session times and blocked time for a consultant — a free time must not sit on top of these. */
  private async diary(consultantId: string, start: Date, end: Date) {
    const [sessions, blocked] = await Promise.all([
      this.db.consultationSlot.findMany({
        where: {
          consultantId,
          status: { not: 'CANCELLED' },
          // Sessions run up to a few hours, so look a little before the window too.
          startAt: { gte: new Date(start.getTime() - 4 * 3600000), lt: end },
        },
        select: { startAt: true, durationMinutes: true },
      }),
      this.db.consultantBlockedTime.findMany({
        where: { consultantId, startAt: { lt: end }, endAt: { gt: start } },
        select: { startAt: true, endAt: true },
      }),
    ]);
    return [
      ...sessions.map((s) => ({ start: s.startAt.getTime(), end: s.startAt.getTime() + s.durationMinutes * 60000, kind: 'session' as const })),
      ...blocked.map((b) => ({ start: b.startAt.getTime(), end: b.endAt.getTime(), kind: 'blocked' as const })),
    ].filter((b) => overlaps(b.start, b.end, start.getTime(), end.getTime()));
  }

  /** Works out which requested times can be added and which must be skipped, without saving. */
  async planSlots(user: AuthUser, input: SlotPlanInput) {
    const mine = await this.scope(user);
    this.assertAllowed(mine, input?.consultantId);
    const consultant = input?.consultantId
      ? await this.db.consultantProfile.findUnique({ where: { id: input.consultantId }, select: { id: true } })
      : null;
    if (!consultant) throw new BadRequestException('Choose a consultant.');
    if (!DATE_RE.test(input.startDate ?? '')) throw new BadRequestException('Choose a start date.');
    const weeks = Number(input.weeks);
    if (!Number.isInteger(weeks) || weeks < 1 || weeks > MAX_WEEKS) {
      throw new BadRequestException(`Times can be added for 1 to ${MAX_WEEKS} weeks at once.`);
    }
    const weekdays = [...new Set((input.weekdays ?? []).map(Number))].filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
    if (weekdays.length === 0) throw new BadRequestException('Choose at least one day of the week.');
    const times = [...new Set(input.times ?? [])].sort();
    if (times.length === 0) throw new BadRequestException('Choose at least one time.');
    if (times.length > MAX_TIMES_PER_DAY || times.some((t) => !TIME_RE.test(t))) {
      throw new BadRequestException('One of the times is not valid.');
    }

    const wanted: { start: number; end: number; date: string }[] = [];
    for (let i = 0; i < weeks * 7; i++) {
      const date = addDays(input.startDate, i);
      if (!weekdays.includes(weekdayOf(date))) continue;
      for (const time of times) {
        const start = doualaToUtc(date, time).getTime();
        wanted.push({ start, end: start + SLOT_MINUTES * 60000, date });
      }
    }
    wanted.sort((a, b) => a.start - b.start);
    const skipped = { existing: 0, clash: 0, past: 0 };
    if (wanted.length === 0) return { consultantId: consultant.id, add: [] as typeof wanted, skipped };

    const from = new Date(wanted[0].start);
    const to = new Date(wanted[wanted.length - 1].end);
    const [existing, busy] = await Promise.all([
      this.db.bookingSlot.findMany({
        where: { consultantId: consultant.id, resourceId: { not: RETIRED_RESOURCE }, startTime: { lt: to }, endTime: { gt: from } },
        select: { startTime: true, endTime: true },
      }),
      this.diary(consultant.id, from, to),
    ]);
    const taken = existing.map((s) => ({ start: s.startTime.getTime(), end: s.endTime.getTime() }));

    const now = Date.now();
    const add: typeof wanted = [];
    for (const w of wanted) {
      if (w.start <= now) skipped.past++;
      else if (taken.some((t) => overlaps(w.start, w.end, t.start, t.end))) skipped.existing++;
      else if (busy.some((b) => overlaps(w.start, w.end, b.start, b.end))) skipped.clash++;
      else {
        add.push(w);
        taken.push(w); // two requested times that overlap each other: keep the first
      }
    }
    return { consultantId: consultant.id, add, skipped };
  }

  async previewSlots(user: AuthUser, input: SlotPlanInput) {
    const plan = await this.planSlots(user, input);
    return { adding: plan.add.length, skipped: plan.skipped };
  }

  async createSlots(user: AuthUser, input: SlotPlanInput) {
    const plan = await this.planSlots(user, input);
    if (plan.add.length > 0) {
      await this.db.bookingSlot.createMany({
        data: plan.add.map((s) => ({
          resourceId: FREE_CONSULT_RESOURCE,
          consultantId: plan.consultantId,
          // The public booking page looks times up by their Douala calendar day.
          date: new Date(doualaDate(new Date(s.start))),
          startTime: new Date(s.start),
          endTime: new Date(s.end),
          isBooked: false,
        })),
      });
    }
    return { added: plan.add.length, skipped: plan.skipped };
  }

  async removeSlot(user: AuthUser, slotId: string) {
    const mine = await this.scope(user);
    const slot = await this.db.bookingSlot.findUnique({
      where: { id: slotId },
      include: { _count: { select: { bookings: true } } },
    });
    if (!slot || slot.resourceId !== FREE_CONSULT_RESOURCE) throw new NotFoundException('That time no longer exists.');
    this.assertAllowed(mine, slot.consultantId);
    if (slot.isBooked) {
      throw new BadRequestException('Someone has booked this time. Move or cancel their booking first.');
    }
    // A time that was booked and later cancelled keeps its history, so it is hidden rather than deleted.
    if ((slot as any)._count.bookings > 0) {
      await this.db.bookingSlot.update({ where: { id: slotId }, data: { resourceId: RETIRED_RESOURCE } });
    } else {
      await this.db.bookingSlot.delete({ where: { id: slotId } });
    }
    return { removed: true };
  }

  // ── Running the session ─────────────────────────────────────────────────────

  async hostJoin(user: AuthUser, bookingId: string) {
    const { booking } = await this.loadBooking(user, bookingId);
    const clientName = this.contact(booking).name;
    if (booking.status !== 'CONFIRMED') {
      return { roomUrl: null, token: null, clientName, message: 'This consultation is no longer going ahead.' };
    }
    try {
      const room = await this.dailyCo.ensureRoom(booking.id, booking.slot.startTime, ROOM_MINUTES);
      const hostName = (booking.slot as any).consultant?.name ?? user.email ?? 'Advisor';
      const token = await this.dailyCo.createMeetingToken(room.name, true, hostName);
      return { roomUrl: room.url, token, clientName, message: null };
    } catch (err) {
      this.logger.error(`Could not open the room for free consultation ${booking.id}: ${err}`);
      return { roomUrl: null, token: null, clientName, message: 'The video room could not be opened. Try again in a minute.' };
    }
  }

  /** Attended → the lead moves to "consultation done". Missed → they stay booked, flagged for follow-up. */
  async setOutcome(user: AuthUser, bookingId: string, attended: boolean) {
    const { booking } = await this.loadBooking(user, bookingId);
    if (booking.status === 'CANCELLED') throw new BadRequestException('This booking was cancelled.');
    if (booking.slot.startTime.getTime() > Date.now()) {
      throw new BadRequestException('This consultation has not started yet.');
    }
    await this.db.booking.update({
      where: { id: bookingId },
      data: attended ? { status: 'COMPLETED', noShowAt: null } : { status: 'CONFIRMED', noShowAt: new Date() },
    });
    // Only step the lead between these two stages — never pull back one that has moved further on.
    if (booking.leadId) {
      await this.db.lead.updateMany({
        where: { id: booking.leadId, status: (attended ? 'FREE_CONSULT_BOOKED' : 'FREE_CONSULT_DONE') as any },
        data: { status: (attended ? 'FREE_CONSULT_DONE' : 'FREE_CONSULT_BOOKED') as any },
      });
    }
    return { id: bookingId, status: attended ? 'COMPLETED' : 'CONFIRMED', missed: !attended };
  }

  async cancel(user: AuthUser, bookingId: string, reason: string, reopen: boolean) {
    const { booking } = await this.loadBooking(user, bookingId);
    const why = (reason ?? '').trim();
    if (why.length < 3) throw new BadRequestException('Say why, so the person knows — they are emailed your reason.');
    if (booking.status !== 'CONFIRMED') throw new BadRequestException('This booking is already closed.');
    if (booking.slot.startTime.getTime() <= Date.now()) {
      throw new BadRequestException('This consultation has already started. Record whether the person attended instead.');
    }

    await this.db.$transaction([
      this.db.booking.update({ where: { id: bookingId }, data: { status: 'CANCELLED', cancelReason: why } }),
      this.db.bookingSlot.update({
        where: { id: booking.slotId },
        data: { isBooked: false, resourceId: reopen ? FREE_CONSULT_RESOURCE : RETIRED_RESOURCE },
      }),
    ]);
    if (booking.leadId) {
      await this.db.lead.updateMany({
        where: { id: booking.leadId, status: 'FREE_CONSULT_BOOKED' as any },
        data: { status: 'CONTACTED' as any },
      });
    }
    // Close the room so the old join link stops working.
    void this.dailyCo.deleteRoom(`mjn-consult-${booking.id}`).catch(() => undefined);

    const who = this.contact(booking);
    this.events.emit('free_consult.cancelled', {
      bookingId,
      ...who,
      slotStart: booking.slot.startTime.toISOString(),
      reason: why,
      consultantName: (booking.slot as any).consultant?.name ?? null,
      consultantEmail: (booking.slot as any).consultant?.email ?? null,
      byEmail: user.email ?? null,
    });
    return { id: bookingId, status: 'CANCELLED', reopened: reopen };
  }

  async move(user: AuthUser, bookingId: string, slotId: string) {
    const { booking, mine } = await this.loadBooking(user, bookingId);
    if (booking.status !== 'CONFIRMED') throw new BadRequestException('This booking is already closed.');
    if (!slotId || slotId === booking.slotId) throw new BadRequestException('Choose a different time.');
    const target = await this.db.bookingSlot.findUnique({
      where: { id: slotId },
      include: { consultant: { select: { id: true, name: true, email: true } } },
    });
    if (!target || target.resourceId !== FREE_CONSULT_RESOURCE) throw new NotFoundException('That time no longer exists.');
    this.assertAllowed(mine, target.consultantId);
    if (target.startTime.getTime() <= Date.now()) throw new BadRequestException('That time has already passed.');

    // Claim the new time first, so two people can never end up in it.
    const claimed = await this.db.bookingSlot.updateMany({ where: { id: slotId, isBooked: false }, data: { isBooked: true } });
    if (claimed.count === 0) throw new BadRequestException('That time has just been taken. Choose another.');
    await this.db.$transaction([
      this.db.booking.update({ where: { id: bookingId }, data: { slotId, noShowAt: null } }),
      this.db.bookingSlot.update({ where: { id: booking.slotId }, data: { isBooked: false } }),
    ]);

    const who = this.contact(booking);
    const consultant = (target as any).consultant as { id: string; name: string; email: string | null } | null;
    let guestUrl = '';
    let hostUrl = '';
    try {
      const room = await this.dailyCo.ensureRoom(booking.id, target.startTime, ROOM_MINUTES);
      const hostToken = await this.dailyCo.createMeetingToken(room.name, true, consultant?.name ?? 'Advisor');
      hostUrl = `${room.url}?t=${hostToken}`;
      if (who.email) guestUrl = freeConsultGuestLink(booking.id, who.email);
    } catch (err) {
      this.logger.error(`Could not prepare the room for moved free consultation ${booking.id}: ${err}`);
    }

    void this.queueReminders({
      bookingId: booking.id,
      leadName: who.name,
      leadEmail: who.email,
      leadPhone: who.phone ?? undefined,
      consultantName: consultant?.name,
      consultantEmail: consultant?.email ?? undefined,
      slotStart: target.startTime.toISOString(),
      roomUrl: guestUrl,
      hostUrl,
    });

    const before = (booking.slot as any).consultant as { id: string; name: string; email: string | null } | null;
    this.events.emit('free_consult.moved', {
      bookingId,
      ...who,
      oldStart: booking.slot.startTime.toISOString(),
      newStart: target.startTime.toISOString(),
      roomUrl: guestUrl,
      hostUrl,
      consultantName: consultant?.name ?? null,
      consultantEmail: consultant?.email ?? null,
      previousConsultantName: before && before.id !== consultant?.id ? before.name : null,
      previousConsultantEmail: before && before.id !== consultant?.id ? before.email : null,
    });
    return { id: bookingId, start: target.startTime, consultantId: target.consultantId };
  }

  /** Reminders are checked against the booking when they fire, so ones for the old time fall away. */
  private async queueReminders(data: Record<string, unknown> & { slotStart: string }) {
    const startMs = new Date(data.slotStart).getTime();
    const schedule = [
      { name: 'free-consult-reminder-24h', offset: 24 * 60 * 60 * 1000 },
      { name: 'free-consult-reminder-1h', offset: 60 * 60 * 1000 },
      { name: 'free-consult-reminder-15m', offset: 15 * 60 * 1000 },
    ];
    try {
      for (const { name, offset } of schedule) {
        const delay = startMs - offset - Date.now();
        if (delay > 0) await this.reminderQueue.add(name, data, { delay });
      }
    } catch (err) {
      this.logger.warn(`Could not schedule reminders for moved free consultation: ${err}`);
    }
  }
}
