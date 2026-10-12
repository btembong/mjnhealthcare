import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { paymentVerifier, belongsTo, isOver, PAID_ELSEWHERE, PAID_AFTER_CANCEL } from '../../common/payment-verifier';

export type BookingPaymentStatus = 'confirmed' | 'pending' | 'failed' | 'paid_after_cancel' | 'ignored';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { DatabaseService } from '@mjn/database';
import { DailyCoService } from './daily-co.service';
import { RefundService } from './refund.service';
import {
  BookConsultationDto,
  CreateConsultantDto,
  UpdateConsultantDto,
  CreateSlotDto,
  SubmitApplicationDto,
  ReviewApplicationDto,
  MarkPayoutPaidDto,
  CreateAvailabilityRuleDto,
  CreateBlockedTimeDto,
} from './consultation.dto';

// A client may move a confirmed session themselves this many times, and only this far ahead.
const MAX_CLIENT_RESCHEDULES = 1;
const RESCHEDULE_MIN_HOURS = 24;

const sameEmail = (a?: string | null, b?: string | null) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

/** The address, if it is on the portal or the website; anything else is dropped so we never send a payer elsewhere. */
function ownSiteUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const origin = new URL(url).origin;
    const ours = [process.env.PORTAL_URL ?? 'http://localhost:3002', process.env.WEB_URL ?? 'http://localhost:3001'].map((u) => new URL(u).origin);
    return ours.includes(origin) ? url : undefined;
  } catch {
    return undefined;
  }
}

@Injectable()
export class ConsultationService {
  private readonly logger = new Logger(ConsultationService.name);
  private readonly stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
    apiVersion: '2026-09-30.endive',
  });

  constructor(
    private readonly db: DatabaseService,
    private readonly events: EventEmitter2,
    private readonly dailyCo: DailyCoService,
    private readonly refundService: RefundService,
    @InjectQueue('consultation-reminders') private readonly reminderQueue: Queue,
  ) {}

  // ── Public: list consultants ────────────────────────────────────────────────

  /**
   * A client's own sessions. Leaves out the consultant's private case note, the payment
   * reference, the recording and the video room details: the room is reached through the join route.
   */
  async getClientBookings(clientEmail: string) {
    const bookings = await this.db.consultationBooking.findMany({
      where: { clientEmail: { equals: clientEmail, mode: 'insensitive' } },
      select: {
        id: true, status: true, consultationCategory: true, preSessionNote: true, amountPaid: true,
        refundAmount: true, refundedAt: true, rescheduleCount: true, createdAt: true, completedAt: true,
        slot: {
          select: {
            id: true, startAt: true, durationMinutes: true, isFree: true, consultantId: true,
            consultant: { select: { id: true, name: true, bio: true, photoUrl: true, specialty: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    const earliest = Date.now() + RESCHEDULE_MIN_HOURS * 60 * 60 * 1000;
    return bookings.map((b) => ({
      ...b,
      canReschedule: b.status === 'CONFIRMED' && b.rescheduleCount < MAX_CLIENT_RESCHEDULES && b.slot.startAt.getTime() > earliest,
    }));
  }

  /** The email address a logged-in person books under. */
  async emailOf(personId: string): Promise<string> {
    const person = await this.db.person.findUnique({ where: { id: personId }, select: { email: true } });
    if (!person?.email) throw new ForbiddenException('Your account has no email address to match a booking.');
    return person.email;
  }

  /**
   * A slot keeps a link to its booking even after that booking is cancelled, and a slot can
   * hold only one. Move the old cancelled booking onto an archived copy so the slot can be booked again.
   */
  private async detachCancelledBooking(slotId: string) {
    const prior = await this.db.consultationBooking.findUnique({ where: { slotId }, include: { slot: true } });
    if (!prior) return;
    if (prior.status !== 'CANCELLED') throw new ConflictException('That time is no longer available. Please choose another.');
    const archive = await this.db.consultationSlot.create({
      data: {
        consultantId: prior.slot.consultantId,
        startAt: prior.slot.startAt,
        durationMinutes: prior.slot.durationMinutes,
        isFree: prior.slot.isFree,
        status: 'CANCELLED',
      },
    });
    await this.db.consultationBooking.update({ where: { id: prior.id }, data: { slotId: archive.id } });
  }

  /** Reminders before a session, for the client and the consultant. */
  private async scheduleReminders(booking: {
    id: string; clientName: string; clientEmail: string; clientPhone: string; preSessionNote: string | null;
    consultant: { name: string; email: string | null };
  }, startAt: Date, roomUrl: string) {
    const now = Date.now();
    const sessionMs = startAt.getTime();
    const payload = {
      bookingId: booking.id,
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      clientPhone: booking.clientPhone,
      consultantName: booking.consultant.name,
      sessionStart: startAt.toISOString(),
      roomUrl,
    };
    const reminders: Array<{ name: string; offsetMs: number }> = [
      { name: 'consultation-reminder-48h', offsetMs: 48 * 60 * 60 * 1000 },
      { name: 'consultation-reminder-2h',  offsetMs: 2  * 60 * 60 * 1000 },
      { name: 'consultation-reminder-15m', offsetMs: 15 * 60 * 1000 },
    ];
    for (const r of reminders) {
      const delay = sessionMs - r.offsetMs - now;
      if (delay > 0) await this.reminderQueue.add(r.name, payload, { delay });
    }
    const consultantDelay = sessionMs - 30 * 60 * 1000 - now;
    if (consultantDelay > 0) {
      await this.reminderQueue.add('consultation-reminder-consultant', {
        ...payload,
        consultantEmail: booking.consultant.email,
        preSessionNote: booking.preSessionNote,
      }, { delay: consultantDelay });
    }
  }

  /** What cancelling right now would refund, under the standing rule. Changes nothing. */
  async cancelPreview(bookingId: string, clientEmail: string) {
    const booking = await this.db.consultationBooking.findUnique({ where: { id: bookingId }, include: { slot: true } });
    if (!booking || !sameEmail(booking.clientEmail, clientEmail)) throw new NotFoundException('Booking not found');
    // A booking that is still waiting for payment has nothing to refund.
    const paid = booking.status !== 'AWAITING_PAYMENT';
    const refund = this.refundService.calculate(Number(booking.amountPaid), booking.slot.startAt);
    return {
      amountPaid: paid ? Number(booking.amountPaid) : 0,
      refundAmount: paid ? refund.refundAmount : 0,
      refundPercent: paid ? refund.refundPercent : 0,
      canCancel: ['CONFIRMED', 'AWAITING_PAYMENT'].includes(booking.status),
    };
  }

  /**
   * The client moves a confirmed session to another free time with the same consultant.
   * Allowed once, and only more than 24 hours before the session; the payment stays as it is.
   */
  rescheduleBooking(bookingId: string, clientEmail: string, newSlotId: string) {
    return this.moveBooking(bookingId, newSlotId, { clientEmail });
  }

  /** The consultant (or an admin) moves a session. The client's own one free move is not used up. */
  rescheduleByStaff(bookingId: string, newSlotId: string) {
    return this.moveBooking(bookingId, newSlotId, { byStaff: true });
  }

  private async moveBooking(bookingId: string, newSlotId: string, by: { clientEmail?: string; byStaff?: boolean }) {
    const booking = await this.db.consultationBooking.findUnique({
      where: { id: bookingId },
      include: { slot: true, consultant: true },
    });
    if (!booking || (!by.byStaff && !sameEmail(booking.clientEmail, by.clientEmail))) throw new NotFoundException('Booking not found');
    if (booking.status !== 'CONFIRMED') throw new BadRequestException('Only a confirmed session can be moved.');
    const now = new Date();
    if (by.byStaff) {
      if (booking.slot.startAt.getTime() + booking.slot.durationMinutes * 60000 < now.getTime()) {
        throw new BadRequestException('This session has already ended.');
      }
    } else {
      if (booking.rescheduleCount >= MAX_CLIENT_RESCHEDULES) {
        throw new BadRequestException('This session has already been moved once. Message your team to change it again.');
      }
      if (booking.slot.startAt.getTime() - now.getTime() <= RESCHEDULE_MIN_HOURS * 60 * 60 * 1000) {
        throw new BadRequestException('A session can only be moved more than 24 hours before it starts.');
      }
    }
    if (newSlotId === booking.slotId) throw new BadRequestException('Choose a different time.');

    const target = await this.db.consultationSlot.findUnique({ where: { id: newSlotId } });
    if (!target || target.consultantId !== booking.consultantId || target.isFree !== booking.slot.isFree || target.startAt <= now) {
      throw new ConflictException('That time is no longer available. Please choose another.');
    }

    // Claim the new time first; only one request can win it.
    const claimed = await this.db.consultationSlot.updateMany({
      where: {
        id: newSlotId,
        OR: [{ status: 'AVAILABLE' }, { status: 'RESERVED', reservedUntil: { lt: now } }],
      },
      data: { status: 'BOOKED', reservedUntil: null, reservedBy: null },
    });
    if (claimed.count !== 1) throw new ConflictException('That time is no longer available. Please choose another.');

    const oldSlotId = booking.slotId;
    const oldStart = booking.slot.startAt;
    try {
      await this.detachCancelledBooking(newSlotId);
      await this.db.$transaction([
        this.db.consultationBooking.update({
          where: { id: bookingId },
          data: { slotId: newSlotId, rescheduledAt: now, ...(by.byStaff ? {} : { rescheduleCount: { increment: 1 } }) },
        }),
        this.db.consultationSlot.update({
          where: { id: oldSlotId },
          data: { status: 'AVAILABLE', reservedUntil: null, reservedBy: null },
        }),
      ]);
    } catch (err) {
      // Give the new time back if the move itself failed.
      await this.db.consultationSlot.update({ where: { id: newSlotId }, data: { status: 'AVAILABLE' } }).catch(() => undefined);
      throw err;
    }

    // The video room closes shortly after the original time, so the session needs a new one.
    let dailyRoomUrl = booking.dailyRoomUrl ?? '';
    try {
      if (booking.dailyRoomName) await this.dailyCo.deleteRoom(booking.dailyRoomName).catch(() => undefined);
      const room = await this.dailyCo.createRoom(booking.id, target.startAt, target.durationMinutes);
      dailyRoomUrl = room.url;
      await this.db.consultationBooking.update({ where: { id: bookingId }, data: { dailyRoomUrl: room.url, dailyRoomName: room.name } });
    } catch (err) {
      this.logger.error(`Video room could not be recreated for moved booking ${bookingId}: ${err}`);
      await this.db.consultationBooking.update({ where: { id: bookingId }, data: { dailyRoomUrl: null, dailyRoomName: null } }).catch(() => undefined);
      dailyRoomUrl = '';
    }

    // Old reminders stop themselves when they see the time has changed; queue the new ones without holding up the reply.
    this.scheduleReminders(booking, target.startAt, dailyRoomUrl).catch((err) =>
      this.logger.error(`Reminders could not be queued for moved booking ${bookingId}: ${err}`));

    this.events.emit('consultation.rescheduled', {
      bookingId,
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      clientPhone: booking.clientPhone,
      consultantName: booking.consultant.name,
      consultantEmail: booking.consultant.email,
      oldStart: oldStart.toISOString(),
      newStart: target.startAt.toISOString(),
      durationMins: target.durationMinutes,
      movedBy: by.byStaff ? 'consultant' : 'client',
    });

    return { id: bookingId, startAt: target.startAt, durationMinutes: target.durationMinutes };
  }

  async listConsultants(category?: string) {
    return this.db.consultantProfile.findMany({
      where: {
        isActive: true,
        status: 'ACTIVE',
        ...(category && category !== 'BOTH'
          ? {
              consultationCategory: {
                in: [category as any, 'BOTH'],
              },
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        bio: true,
        photoUrl: true,
        specialty: true,
        languages: true,
        consultationCategory: true,
        priceUsd: true,
        sessionDurationMins: true,
        rating: true,
        sessionCount: true,
        timezone: true,
      },
      orderBy: [{ rating: 'desc' }, { sessionCount: 'desc' }],
    });
  }

  // ── Public: available slots for a consultant ────────────────────────────────

  async getAvailableSlots(consultantId: string) {
    const from = new Date();
    const to = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000); // next 28 days
    const now = new Date();
    // Return AVAILABLE slots + RESERVED slots whose hold has expired (client sees them as available)
    return this.db.consultationSlot.findMany({
      where: {
        consultantId,
        startAt: { gte: from, lte: to },
        OR: [
          { status: 'AVAILABLE' },
          { status: 'RESERVED', reservedUntil: { lt: now } },
        ],
      },
      orderBy: { startAt: 'asc' },
    });
  }

  // ── Public: hold a slot for checkout (10-minute reservation) ────────────────

  async holdSlot(slotId: string, clientEmail: string) {
    const HOLD_MINUTES = 10;
    const reservedUntil = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);
    const now = new Date();

    // Atomic: find-and-update in a single transaction to prevent race conditions.
    // We use $transaction with a raw SELECT FOR UPDATE via executeRaw, then update.
    // Prisma doesn't support FOR UPDATE natively, so we use executeRawUnsafe inside
    // a transaction to lock the row.
    const result = await this.db.$transaction(async (tx) => {
      // Lock the row
      const slots = await tx.$queryRaw<Array<{ id: string; status: string; reservedUntil: Date | null; reservedBy: string | null }>>`
        SELECT id, status, "reservedUntil", "reservedBy"
        FROM consultation_slots
        WHERE id = ${slotId}
        FOR UPDATE
      `;
      const slot = slots[0];
      if (!slot) throw new NotFoundException('Slot not found');

      const isAvailable =
        slot.status === 'AVAILABLE' ||
        (slot.status === 'RESERVED' && slot.reservedBy === clientEmail) ||
        (slot.status === 'RESERVED' && slot.reservedUntil && slot.reservedUntil < now);

      if (!isAvailable) {
        throw new ConflictException('Slot is no longer available — please choose another time');
      }

      return tx.consultationSlot.update({
        where: { id: slotId },
        data: { status: 'RESERVED', reservedUntil, reservedBy: clientEmail },
      });
    });

    return { slotId, reservedUntil: result.reservedUntil, holdMinutes: HOLD_MINUTES };
  }

  // ── Admin: mark a slot as free ──────────────────────────────────────────────

  async markSlotFree(slotId: string, isFree: boolean) {
    const slot = await this.db.consultationSlot.findUnique({ where: { id: slotId } });
    if (!slot) throw new NotFoundException('Slot not found');
    if (slot.status === 'BOOKED') throw new BadRequestException('Cannot change a booked slot');
    return this.db.consultationSlot.update({ where: { id: slotId }, data: { isFree } });
  }

  // ── Public: initiate booking ─────────────────────────────────────────────────

  async initiateBooking(dto: BookConsultationDto) {
    const now = new Date();

    // Validate slot is available or held by this client
    const slot = await this.db.consultationSlot.findUnique({ where: { id: dto.slotId } });
    if (!slot) throw new NotFoundException('Slot not found');

    // The hold is placed at slot-pick time, before the client's email is known, so it is
    // usually recorded under the visitor's hold token rather than their email.
    // LEGACY_ANON_HOLD: pages loaded before the token existed held every slot under one
    // shared placeholder; such a hold can't identify anyone, so it doesn't block a booking.
    const LEGACY_ANON_HOLD = 'anon@mjn.hold';
    const isOwnHold = (reservedBy: string | null) =>
      !!reservedBy && (reservedBy === dto.clientEmail || reservedBy === dto.holdToken || reservedBy === LEGACY_ANON_HOLD);

    const heldByThisClient = slot.status === 'RESERVED' && isOwnHold(slot.reservedBy) && slot.reservedUntil && slot.reservedUntil > now;
    const isOpen = slot.status === 'AVAILABLE' || (slot.status === 'RESERVED' && slot.reservedUntil && slot.reservedUntil < now);

    if (!heldByThisClient && !isOpen) {
      throw new ConflictException('Slot is no longer available');
    }

    const consultant = await this.db.consultantProfile.findUnique({
      where: { id: slot.consultantId },
    });
    if (!consultant || !consultant.isActive) {
      throw new BadRequestException('Consultant not available');
    }

    // ── Free session: check per-email limit (1 per category) ────────────────
    if (slot.isFree) {
      const existing = await this.db.freeSessionUsage.findUnique({
        where: { email_category: { email: dto.clientEmail, category: dto.consultationCategory } },
      });
      if (existing && existing.count >= 1) {
        throw new BadRequestException('You have already used your free consultation in this category. Book a paid session to continue.');
      }
    }

    // Mark slot BOOKED atomically
    await this.db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: string; status: string; reservedBy: string | null; reservedUntil: Date | null }>>`
        SELECT id, status, "reservedBy", "reservedUntil"
        FROM consultation_slots
        WHERE id = ${dto.slotId}
        FOR UPDATE
      `;
      const s = rows[0];
      if (!s) throw new NotFoundException('Slot not found');

      const stillOk =
        s.status === 'AVAILABLE' ||
        (s.status === 'RESERVED' && isOwnHold(s.reservedBy) && s.reservedUntil && s.reservedUntil > now) ||
        (s.status === 'RESERVED' && s.reservedUntil && s.reservedUntil < now);

      if (!stillOk) throw new ConflictException('Slot was just taken');

      await tx.consultationSlot.update({
        where: { id: dto.slotId },
        data: { status: 'BOOKED', reservedUntil: null, reservedBy: null },
      });
    });

    // A time freed by a cancellation still carries the cancelled booking; move that aside first.
    await this.detachCancelledBooking(dto.slotId);

    const booking = await this.db.consultationBooking.create({
      data: {
        slotId: dto.slotId,
        consultantId: slot.consultantId,
        clientName: dto.clientName,
        clientEmail: dto.clientEmail,
        clientPhone: dto.clientPhone,
        preSessionNote: dto.preSessionNote,
        consultationCategory: dto.consultationCategory as any,
        recordingConsent: dto.recordingConsent,
        status: 'AWAITING_PAYMENT',
        amountPaid: slot.isFree ? 0 : consultant.priceUsd,
      },
    });

    // ── Free slot: bypass payment, confirm immediately ───────────────────────
    if (slot.isFree) {
      await this.db.freeSessionUsage.upsert({
        where: { email_category: { email: dto.clientEmail, category: dto.consultationCategory } },
        update: { count: { increment: 1 }, updatedAt: new Date() },
        create: { email: dto.clientEmail, category: dto.consultationCategory, count: 1, updatedAt: new Date() },
      });
      await this.handlePaymentConfirmed(booking.id);
      const webUrl = process.env.WEB_URL ?? 'http://localhost:3001';
      return { bookingId: booking.id, redirectUrl: `${webUrl}/consult/confirmed?bookingId=${booking.id}&free=1` };
    }

    // ── DEV BYPASS ─────────────────────────────────────────────────────────────
    if (process.env.DEV_SKIP_PAYMENT === 'true') {
      this.logger.warn(`[DEV] Skipping Tranzak — auto-confirming booking ${booking.id}`);
      await this.handlePaymentConfirmed(booking.id);
      const devReturnUrl = dto.returnUrl
        ? `${dto.returnUrl}?bookingId=${booking.id}`
        : `${process.env.WEB_URL ?? 'http://localhost:3001'}/consult/confirmed?bookingId=${booking.id}`;
      return { bookingId: booking.id, redirectUrl: devReturnUrl };
    }

    const webUrl = process.env.WEB_URL ?? 'http://localhost:3001';

    // ── Stripe payment ───────────────────────────────────────────────────────
    if (dto.provider === 'stripe') {
      const stripeReturnBase = dto.returnUrl
        ? `${dto.returnUrl}?bookingId=${booking.id}`
        : `${webUrl}/consult/confirmed?bookingId=${booking.id}`;
      try {
        const session = await this.stripe.checkout.sessions.create({
          mode: 'payment',
          line_items: [{
            price_data: {
              currency: 'usd',
              unit_amount: Math.round(Number(consultant.priceUsd) * 100),
              product_data: {
                name: `${dto.consultationCategory} Consultation — ${consultant.name} (${consultant.sessionDurationMins} min)`,
              },
            },
            quantity: 1,
          }],
          success_url: `${stripeReturnBase}&session_id={CHECKOUT_SESSION_ID}&provider=stripe`,
          cancel_url: ownSiteUrl(dto.cancelUrl) ?? `${webUrl}/consult`,
          customer_email: dto.clientEmail,
          metadata: { bookingId: booking.id },
        });

        if (session.id) {
          await this.db.consultationBooking.update({
            where: { id: booking.id },
            data: { paymentRef: session.id },
          });
        }

        if (!session.url) throw new Error('Stripe did not return a redirect URL');

        this.logger.log(`Stripe Checkout session ${session.id} created for booking ${booking.id}`);
        return { bookingId: booking.id, redirectUrl: session.url };
      } catch (err) {
        // Release slot AND delete the orphaned booking so the slot can be rebooked
        await this.db.$transaction([
          this.db.consultationSlot.update({
            where: { id: dto.slotId },
            data: { status: 'AVAILABLE' },
          }),
          this.db.consultationBooking.delete({
            where: { id: booking.id },
          }),
        ]);
        this.logger.error(`Stripe payment initiation error for booking ${booking.id}: ${err}`);
        throw new BadRequestException(
          err instanceof Error ? err.message : 'Stripe payment could not be initiated. Please try again.',
        );
      }
    }

    // Initiate Tranzak payment
    const returnUrl = dto.returnUrl
      ? `${dto.returnUrl}?bookingId=${booking.id}`
      : `${webUrl}/consult/confirmed?bookingId=${booking.id}`;
    const notifyUrl = `${process.env.API_URL ?? 'http://localhost:3000'}/api/v1/consultations/webhook/payment`;

    try {
      const authRes = await fetch(`${process.env.TRANZAK_BASE_URL ?? 'https://dsapi.tranzak.me'}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: process.env.TRANZAK_APP_ID, appKey: process.env.TRANZAK_APP_KEY }),
      });
      const auth = await authRes.json() as { data?: { token?: string } };
      const token = auth.data?.token;
      if (!token) {
        this.logger.error(`Tranzak auth failed for booking ${booking.id}: ${JSON.stringify(auth)}`);
        throw new Error('Payment gateway authentication failed');
      }

      const amountUsd = Number(consultant.priceUsd);
      let xafRate = 655;
      try {
        const rateRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD', { signal: AbortSignal.timeout(4000) });
        if (rateRes.ok) {
          const rateData = await rateRes.json() as { rates?: { XAF?: number } };
          if (rateData.rates?.XAF && rateData.rates.XAF > 400) xafRate = rateData.rates.XAF;
        }
      } catch { /* use fallback */ }
      const amountXaf = Math.round(amountUsd * xafRate);

      const payRes = await fetch(`${process.env.TRANZAK_BASE_URL ?? 'https://dsapi.tranzak.me'}/xp021/v1/request/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: amountXaf,
          currencyCode: 'XAF',
          description: `MJN Healthcare — ${dto.consultationCategory} Consultation with ${consultant.name} ($${amountUsd} USD)`,
          returnUrl,
          callbackUrl: notifyUrl,
          mchTransactionRef: booking.id,
        }),
      });
      const payData = await payRes.json() as { data?: { requestId?: string; links?: { paymentAuthUrl?: string } } };

      if (payData.data?.requestId) {
        await this.db.consultationBooking.update({
          where: { id: booking.id },
          data: { paymentRef: payData.data.requestId },
        });
      }

      const paymentAuthUrl = payData.data?.links?.paymentAuthUrl;
      if (!paymentAuthUrl) {
        this.logger.error(`Tranzak returned no payment URL for booking ${booking.id}: ${JSON.stringify(payData)}`);
        throw new Error('Payment gateway did not return a redirect URL');
      }

      this.events.emit('consultation.initiated', {
        bookingId: booking.id,
        clientName: dto.clientName,
        clientEmail: dto.clientEmail,
        clientPhone: dto.clientPhone,
        consultantName: consultant.name,
        sessionStart: slot.startAt.toISOString(),
        amountUsd: Number(consultant.priceUsd),
        paymentUrl: paymentAuthUrl,
      });

      return { bookingId: booking.id, redirectUrl: paymentAuthUrl };
    } catch (err) {
      // Release slot AND delete orphaned booking so the slot can be rebooked
      await this.db.$transaction([
        this.db.consultationSlot.update({
          where: { id: dto.slotId },
          data: { status: 'AVAILABLE' },
        }),
        this.db.consultationBooking.delete({
          where: { id: booking.id },
        }),
      ]);
      this.logger.error(`Tranzak payment initiation error for booking ${booking.id}: ${err}`);
      throw new BadRequestException(
        err instanceof Error ? err.message : 'Payment could not be initiated. Please try again.',
      );
    }
  }

  // ── Webhook: payment confirmed ──────────────────────────────────────────────

  private readonly confirming = new Map<string, Promise<void>>();

  /**
   * Confirms a paid booking: video room, confirmation email, reminders.
   * Two callers arriving together (a provider notice and the page the client returns to) share
   * one run. Without that, the second would fail to create the room and wipe the first one's link.
   */
  handlePaymentConfirmed(bookingId: string): Promise<void> {
    const running = this.confirming.get(bookingId);
    if (running) return running;
    const run = this.confirmPaidOnce(bookingId).finally(() => this.confirming.delete(bookingId));
    this.confirming.set(bookingId, run);
    return run;
  }

  private async confirmPaidOnce(bookingId: string): Promise<void> {
    const booking = await this.db.consultationBooking.findUnique({
      where: { id: bookingId },
      include: { slot: true, consultant: true },
    });
    if (!booking) return;
    const needsRoom = booking.status === 'CONFIRMED' && !booking.dailyRoomUrl;
    if (booking.status !== 'AWAITING_PAYMENT' && !needsRoom) return;

    let dailyRoomUrl = '';
    let dailyRoomName = '';
    try {
      const room = await this.dailyCo.createRoom(
        booking.id,
        booking.slot.startAt,
        booking.slot.durationMinutes,
      );
      dailyRoomUrl = room.url;
      dailyRoomName = room.name;
    } catch (err) {
      this.logger.error(`Daily.co room creation failed for booking ${bookingId}: ${err}`);
    }

    await this.db.consultationBooking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED', dailyRoomUrl, dailyRoomName, paidAt: booking.paidAt ?? new Date(), paymentClosedAt: new Date() },
    });

    const sessionStart = booking.slot.startAt.toISOString();

    this.events.emit('consultation.confirmed', {
      bookingId,
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      clientPhone: booking.clientPhone,
      consultantName: booking.consultant.name,
      sessionStart,
      durationMins: booking.slot.durationMinutes,
      roomUrl: dailyRoomUrl,
      category: booking.consultationCategory,
      recordingConsent: booking.recordingConsent,
    });

    await this.scheduleReminders(booking, booking.slot.startAt, dailyRoomUrl);

    // ── Auto-create Lead for free sessions ──────────────────────────────────
    const slotWithFree = await this.db.consultationSlot.findUnique({ where: { id: booking.slotId } });
    if (slotWithFree?.isFree) {
      const existingLead = await this.db.lead.findFirst({ where: { email: booking.clientEmail } });
      if (existingLead) {
        await this.db.lead.update({
          where: { id: existingLead.id },
          data: { status: 'FREE_CONSULT_BOOKED' as any, sourceBookingId: bookingId, updatedAt: new Date() },
        });
      } else {
        await this.db.lead.create({
          data: {
            name: booking.clientName,
            email: booking.clientEmail,
            phone: booking.clientPhone,
            serviceInterest: booking.consultationCategory as string,
            status: 'FREE_CONSULT_BOOKED' as any,
            sourceBookingId: bookingId,
          },
        });
      }
      this.events.emit('lead.free_consult_booked', {
        bookingId,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        clientPhone: booking.clientPhone,
        consultantName: booking.consultant.name,
        sessionStart,
        roomUrl: dailyRoomUrl,
        category: booking.consultationCategory,
      });
    }
  }

  // ── Public: booking summary ──────────────────────────────────────────────────

  async getBookingSummary(bookingId: string) {
    // The page a client lands on after paying reads this every few seconds. While the booking is
    // unpaid, each read also asks the provider, so the booking confirms even if no notice arrives.
    await this.verifyBookingPayment(bookingId).catch(() => undefined);
    const booking = await this.db.consultationBooking.findUnique({
      where: { id: bookingId },
      include: {
        consultant: { select: { name: true } },
        slot: { select: { startAt: true, durationMinutes: true, isFree: true } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return {
      status: booking.status,
      clientName: booking.clientName,
      consultantName: booking.consultant.name,
      sessionStart: booking.slot.startAt,
      durationMins: booking.slot.durationMinutes,
      amountPaid: booking.amountPaid,
      category: booking.consultationCategory,
      meetingUrl: booking.dailyRoomUrl ?? null,
      isFree: booking.slot.isFree ?? false,
    };
  }

  // ── Public: Tranzak payment webhook ────────────────────────────────────────

  async handlePaymentWebhook(payload: any) {
    const bookingId =
      payload?.resource?.mchTransactionRef ??
      payload?.mchTransactionRef ??
      payload?.data?.mchTransactionRef ??
      payload?.customData?.bookingId;

    if (!bookingId || typeof bookingId !== 'string') {
      this.logger.warn('Tranzak webhook: no bookingId found');
      return;
    }
    // This address is open to anyone, so what the notice claims is ignored. It only tells us which
    // booking to look up; the booking changes only on what Tranzak says when we ask it ourselves.
    const status = await this.verifyBookingPayment(bookingId, true);
    return { received: true, status };
  }

  private readonly lastVerified = new Map<string, number>();
  private readonly verifying = new Map<string, Promise<BookingPaymentStatus>>();

  /**
   * Asks the payment provider about a booking's payment and acts on the answer.
   *
   * Waiting for payment:  paid → confirmed (room, email, reminders) · over without payment → the
   * booking is cancelled and its time released · anything else → left alone, with a note of what
   * the provider said.
   * Cancelled while unpaid (only looked at when `force` is set): if the money has arrived after
   * all, it is recorded with a full refund owed and the team is alerted.
   *
   * Safe for anyone to trigger: it can only act on what the provider reports for this booking's own
   * payment reference. Callers arriving together share one lookup. If the provider cannot be
   * reached the error is passed on.
   */
  verifyBookingPayment(bookingId: string, force = false): Promise<BookingPaymentStatus> {
    const running = this.verifying.get(bookingId);
    if (running) return running;
    const run = this.verifyBookingPaymentOnce(bookingId, force).finally(() => this.verifying.delete(bookingId));
    this.verifying.set(bookingId, run);
    return run;
  }

  private async verifyBookingPaymentOnce(bookingId: string, force: boolean): Promise<BookingPaymentStatus> {
    const booking = await this.db.consultationBooking.findUnique({
      where: { id: bookingId },
      include: { slot: { include: { consultant: { select: { name: true, priceUsd: true } } } } },
    });
    if (!booking) return 'ignored';
    const waiting = booking.status === 'AWAITING_PAYMENT';
    const cancelledUnpaid = booking.status === 'CANCELLED' && !booking.paidAt && !booking.paymentClosedAt;
    if (!waiting && !(cancelledUnpaid && force)) return 'ignored';
    if (!booking.paymentRef) return waiting ? 'pending' : 'ignored';

    // Not more than once every few seconds per booking, however often the page asks.
    const last = this.lastVerified.get(bookingId) ?? 0;
    if (!force && Date.now() - last < 8000) return 'pending';
    this.lastVerified.set(bookingId, Date.now());
    if (this.lastVerified.size > 5000) this.lastVerified.clear();

    const verified = await paymentVerifier.verify(booking.paymentRef);
    const ours = belongsTo(verified, bookingId);
    const over = !verified.paid && isOver(verified, booking.createdAt);
    const said = verified.paid && !ours ? PAID_ELSEWHERE : verified.status ?? 'no record';
    if (verified.paid && !ours) {
      this.logger.error(`${verified.provider} payment ${booking.paymentRef} is paid but belongs to ${verified.ourRef}, not booking ${bookingId}`);
    }
    const system = (action: string, metadata: Record<string, unknown>) =>
      this.db.auditLog.create({ data: { actorId: 'system', action, resourceType: 'ConsultationBooking', resourceId: bookingId, metadata: metadata as any } });

    // ── Cancelled while unpaid ──
    if (!waiting) {
      if (!(verified.paid && ours)) {
        await this.db.consultationBooking.update({
          where: { id: bookingId },
          data: { paymentCheckedAt: new Date(), paymentProviderStatus: said, ...(over ? { paymentClosedAt: new Date() } : {}) },
        });
        return 'ignored';
      }
      // The client paid after the booking was cancelled and its time given up. The money is real, so
      // it is recorded — as received, with the whole amount owed back — and people are told.
      const amount = Number(booking.amountPaid);
      await this.db.consultationBooking.update({
        where: { id: bookingId },
        data: {
          paidAt: new Date(), refundAmount: amount, refundedAt: new Date(),
          paymentCheckedAt: new Date(), paymentProviderStatus: PAID_AFTER_CANCEL, paymentClosedAt: new Date(),
        },
      });
      await system('payment.paid_after_cancel', { via: verified.provider, ref: booking.paymentRef, amount });
      this.logger.warn(`Booking ${bookingId} was paid by ${verified.provider} after it had been cancelled; a refund of ${amount} is owed`);
      this.events.emit('consultation.paid_after_cancel', {
        bookingId,
        clientName: booking.clientName ?? 'Client',
        clientEmail: booking.clientEmail ?? '',
        consultantName: booking.slot?.consultant?.name ?? '—',
        sessionStart: booking.slot?.startAt?.toISOString() ?? '',
        amountUsd: amount,
        provider: verified.provider,
        paymentRef: booking.paymentRef,
      });
      return 'paid_after_cancel';
    }

    // ── Waiting for payment ──
    if (verified.paid && ours) {
      this.logger.log(`Booking ${bookingId} confirmed as paid by ${verified.provider}`);
      await this.db.consultationBooking.update({ where: { id: bookingId }, data: { paymentCheckedAt: new Date(), paymentProviderStatus: verified.status ?? 'paid' } });
      await this.handlePaymentConfirmed(bookingId);
      await system('payment.confirmed_auto', { via: verified.provider, ref: booking.paymentRef });
      return 'confirmed';
    }
    if (!over) {
      await this.db.consultationBooking.update({ where: { id: bookingId }, data: { paymentCheckedAt: new Date(), paymentProviderStatus: said } });
      return 'pending';
    }

    // The provider says this payment is over and no money was taken: close the booking, free the time.
    const stillAhead = !!booking.slot?.startAt && booking.slot.startAt.getTime() > Date.now();
    await this.db.$transaction([
      this.db.consultationBooking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED', paymentCheckedAt: new Date(), paymentProviderStatus: said, paymentClosedAt: new Date() },
      }),
      ...(stillAhead
        ? [this.db.consultationSlot.update({ where: { id: booking.slotId }, data: { status: 'AVAILABLE', reservedUntil: null, reservedBy: null } })]
        : []),
    ]);
    await system('payment.auto_cancelled', { via: verified.provider, reason: said });
    this.logger.warn(`${verified.provider} payment ${said} for booking ${bookingId}; booking cancelled`);
    this.events.emit('consultation.payment_failed', {
      bookingId,
      clientName: booking.clientName ?? 'Unknown',
      clientEmail: booking.clientEmail ?? '',
      clientPhone: booking.clientPhone ?? '',
      consultantName: booking.slot?.consultant?.name ?? '—',
      amountUsd: Number(booking.slot?.consultant?.priceUsd ?? 0),
      failReason: said,
      sessionStart: booking.slot?.startAt?.toISOString() ?? '',
    });
    return 'failed';
  }

  // ── Public: Stripe payment webhook ─────────────────────────────────────────

  async handleStripeWebhook(rawBody: Buffer | string, signature: string): Promise<void> {
    const webhookSecret = process.env.STRIPE_CONSULTATION_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET ?? '';
    if (!webhookSecret) {
      this.logger.warn('STRIPE_WEBHOOK_SECRET not set — skipping consultation Stripe webhook');
      return;
    }
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      this.logger.warn(`Consultation Stripe webhook signature failed: ${err.message}`);
      return;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.bookingId ?? '';
      if (!bookingId) {
        this.logger.warn('Consultation Stripe webhook: no bookingId in session metadata');
        return;
      }
      // The notice is signed, and the session is still fetched from Stripe before anything is confirmed.
      const status = await this.verifyBookingPayment(bookingId, true);
      this.logger.log(`Stripe notice for consultation booking ${bookingId}: ${status}`);
    }
  }

  // ── Public: get join token ──────────────────────────────────────────────────

  async getJoinInfo(bookingId: string, email: string) {
    const booking = await this.db.consultationBooking.findUnique({
      where: { id: bookingId },
      include: { consultant: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (!sameEmail(booking.clientEmail, email)) throw new BadRequestException('Email does not match booking');
    if (booking.status !== 'CONFIRMED') throw new BadRequestException('Booking is not confirmed');

    // Record first join time
    if (!booking.joinedAt) {
      await this.db.consultationBooking.update({
        where: { id: bookingId },
        data: { joinedAt: new Date() },
      });
    }

    if (!booking.dailyRoomName || !booking.dailyRoomUrl) {
      return {
        roomUrl: null,
        token: null,
        consultantName: booking.consultant.name,
        message: 'Your video room is being prepared. Please check back 30 minutes before your session or contact support.',
      };
    }

    const token = await this.dailyCo.createMeetingToken(
      booking.dailyRoomName,
      false,
      booking.clientName,
    );
    return { roomUrl: booking.dailyRoomUrl, token, consultantName: booking.consultant.name, message: null };
  }

  // ── Admin: host join ────────────────────────────────────────────────────────

  async getHostJoinInfo(bookingId: string, hostName: string) {
    const booking = await this.db.consultationBooking.findUnique({
      where: { id: bookingId },
      include: { consultant: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (!booking.dailyRoomName || !booking.dailyRoomUrl) {
      return { roomUrl: null, token: null, message: 'Room not yet created for this session.' };
    }
    const token = await this.dailyCo.createMeetingToken(booking.dailyRoomName, true, hostName);
    return { roomUrl: booking.dailyRoomUrl, token, clientName: booking.clientName, message: null };
  }

  // ── Public: cancel booking ──────────────────────────────────────────────────

  async cancelBooking(bookingId: string, clientEmail: string) {
    const booking = await this.db.consultationBooking.findUnique({
      where: { id: bookingId },
      include: { slot: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (!sameEmail(booking.clientEmail, clientEmail)) throw new BadRequestException('Email does not match booking');
    if (!['CONFIRMED', 'AWAITING_PAYMENT'].includes(booking.status)) {
      throw new BadRequestException('Booking cannot be cancelled');
    }

    // A booking that is still waiting for payment has nothing to refund. It used to be given the
    // refund its price would have earned, and the client was emailed that money was on its way.
    const unpaid = booking.status === 'AWAITING_PAYMENT';
    const refund = unpaid
      ? { refundAmount: 0, refundPercent: 0, reason: 'Cancelled before any payment was made' }
      : this.refundService.calculate(Number(booking.amountPaid), booking.slot.startAt);

    await this.db.$transaction([
      this.db.consultationBooking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED', ...(unpaid ? {} : { refundAmount: refund.refundAmount, refundedAt: new Date() }) },
      }),
      this.db.consultationSlot.update({
        where: { id: booking.slotId },
        data: { status: 'AVAILABLE', reservedUntil: null, reservedBy: null },
      }),
    ]);

    this.events.emit('consultation.cancelled', {
      bookingId,
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      clientPhone: booking.clientPhone,
      refundAmount: refund.refundAmount,
      refundPercent: refund.refundPercent,
      reason: refund.reason,
      unpaid,
      byClient: true,
    });

    return { refundAmount: refund.refundAmount, refundPercent: refund.refundPercent };
  }

  // ── Admin: mark completed ───────────────────────────────────────────────────

  async markCompleted(bookingId: string, caseNote?: string) {
    const booking = await this.db.consultationBooking.findUnique({
      where: { id: bookingId },
      include: { consultant: true, slot: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status === 'COMPLETED') {
      // Already counted: only add or replace the note.
      if (caseNote) await this.db.consultationBooking.update({ where: { id: bookingId }, data: { caseNote } });
      return { success: true };
    }
    if (booking.status !== 'CONFIRMED') throw new BadRequestException('Only a confirmed session can be marked complete.');

    await this.db.consultationBooking.update({
      where: { id: bookingId },
      data: { status: 'COMPLETED', completedAt: new Date(), ...(caseNote ? { caseNote } : {}) },
    });

    await this.db.consultantProfile.update({
      where: { id: booking.consultantId },
      data: { sessionCount: { increment: 1 } },
    });

    if (booking.consultant.type === 'PARTNER') {
      const gross = Number(booking.amountPaid);
      const platformFee = Math.round(gross * Number(booking.consultant.commissionRate) * 100) / 100;
      const net = Math.round((gross - platformFee) * 100) / 100;
      await this.db.consultantPayout.create({
        data: { consultantId: booking.consultantId, bookingId, grossAmount: gross, platformFee, netAmount: net, status: 'PENDING' },
      });
    }

    // If free session: update lead stage to FREE_CONSULT_DONE + schedule 48h follow-up
    if (booking.slot?.isFree) {
      await this.db.lead.updateMany({
        where: { email: booking.clientEmail },
        data: { status: 'FREE_CONSULT_DONE' as any, updatedAt: new Date() },
      });

      // Generate a discount code valid for 7 days
      const discountCode = `MJN10-${booking.clientName.toUpperCase().replace(/\s+/g, '').slice(0, 6)}-${Date.now().toString(36).toUpperCase()}`;
      const discountExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await this.db.lead.updateMany({
        where: { email: booking.clientEmail },
        data: { discountCode, discountExpiry },
      });

      this.events.emit('lead.free_consult_done', {
        bookingId,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        clientPhone: booking.clientPhone,
        consultantName: booking.consultant.name,
        caseNote,
        discountCode,
        discountExpiry: discountExpiry.toISOString(),
      });

      // Schedule 48h follow-up email
      await this.reminderQueue.add('consultation-free-followup', {
        bookingId,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        clientPhone: booking.clientPhone,
        consultantName: booking.consultant.name,
        discountCode,
        discountExpiry: discountExpiry.toISOString(),
      }, { delay: 48 * 60 * 60 * 1000 });
    }

    this.events.emit('consultation.completed', { bookingId });
    return { success: true };
  }

  // ── Admin: consultant CRUD ──────────────────────────────────────────────────

  async createConsultant(dto: CreateConsultantDto) {
    return this.db.consultantProfile.create({
      data: {
        name: dto.name,
        email: dto.email,
        bio: dto.bio,
        photoUrl: dto.photoUrl,
        specialty: dto.specialty,
        languages: dto.languages,
        type: dto.type as any,
        consultationCategory: dto.consultationCategory as any,
        licenseNumber: dto.licenseNumber,
        licenseBody: dto.licenseBody,
        priceUsd: dto.priceUsd,
        sessionDurationMins: dto.sessionDurationMins ?? 45,
        timezone: dto.timezone ?? 'UTC',
        commissionRate: dto.commissionRate ?? 0.25,
        status: 'ACTIVE',
        isActive: true,
      },
    });
  }

  async updateConsultant(id: string, dto: UpdateConsultantDto) {
    return this.db.consultantProfile.update({ where: { id }, data: dto as any });
  }

  async deactivateConsultant(id: string) {
    return this.db.consultantProfile.update({ where: { id }, data: { isActive: false } });
  }

  async reactivateConsultant(id: string) {
    return this.db.consultantProfile.update({ where: { id }, data: { isActive: true } });
  }

  async deleteConsultant(id: string) {
    await this.db.consultationSlot.deleteMany({ where: { consultantId: id, status: 'AVAILABLE' } });
    return this.db.consultantProfile.update({
      where: { id },
      data: { isActive: false, status: 'INACTIVE' as any },
    });
  }

  async createSlot(dto: CreateSlotDto) {
    return this.db.consultationSlot.create({
      data: {
        consultantId: dto.consultantId,
        startAt: new Date(dto.startAt),
        durationMinutes: dto.durationMinutes ?? 45,
        status: 'AVAILABLE',
      },
    });
  }

  async createSlotsBulk(slots: CreateSlotDto[]) {
    return this.db.consultationSlot.createMany({
      data: slots.map((s) => ({
        consultantId: s.consultantId,
        startAt: new Date(s.startAt),
        durationMinutes: s.durationMinutes ?? 45,
        status: 'AVAILABLE',
      })),
    });
  }

  async listAllConsultants(activeOnly = false) {
    return this.db.consultantProfile.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Sessions for the staff console. `onlyConsultantIds` limits a consultant to their own;
   * an admin passes null and may narrow to one consultant.
   */
  async listSessions(onlyConsultantIds: string[] | null, consultantId?: string, status?: string) {
    const bookings = await this.db.consultationBooking.findMany({
      where: {
        ...(onlyConsultantIds ? { consultantId: { in: onlyConsultantIds } } : consultantId ? { consultantId } : {}),
        ...(status ? { status: status as any } : {}),
      },
      select: {
        id: true, status: true, consultationCategory: true, clientName: true, clientEmail: true, clientPhone: true,
        preSessionNote: true, caseNote: true, amountPaid: true, refundAmount: true, rescheduleCount: true,
        rescheduledAt: true, joinedAt: true, completedAt: true, noShowAt: true, createdAt: true, consultantId: true,
        dailyRoomUrl: true,
        slot: { select: { id: true, startAt: true, durationMinutes: true, isFree: true, consultant: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    // Link each session to the client's account when they have one, so staff can open it.
    const emails = [...new Set(bookings.map((b) => b.clientEmail.toLowerCase()))];
    const people = emails.length
      ? await this.db.person.findMany({ where: { email: { in: emails, mode: 'insensitive' } }, select: { id: true, email: true } })
      : [];
    const personByEmail = new Map(people.map((p) => [(p.email ?? '').toLowerCase(), p.id]));
    return bookings.map(({ dailyRoomUrl, ...b }) => ({
      ...b,
      hasRoom: !!dailyRoomUrl,
      personId: personByEmail.get(b.clientEmail.toLowerCase()) ?? null,
    }));
  }

  /** The consultant a booking belongs to, for access checks. */
  async bookingConsultantId(bookingId: string): Promise<string> {
    const booking = await this.db.consultationBooking.findUnique({ where: { id: bookingId }, select: { consultantId: true } });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking.consultantId;
  }

  /**
   * The consultant (or an admin) cancels. The client did not choose this, so they are refunded
   * in full whatever the timing, and the time is not offered to anyone else.
   */
  async cancelByStaff(bookingId: string, reason: string) {
    const why = (reason ?? '').trim();
    if (!why) throw new BadRequestException('Give the client a reason for the cancellation.');
    const booking = await this.db.consultationBooking.findUnique({ where: { id: bookingId }, include: { slot: true } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'CONFIRMED') throw new BadRequestException('Only a confirmed session can be cancelled.');
    const refundAmount = Number(booking.amountPaid);

    await this.db.$transaction([
      this.db.consultationBooking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED', refundAmount, refundedAt: new Date() },
      }),
      this.db.consultationSlot.update({
        where: { id: booking.slotId },
        data: { status: 'CANCELLED', reservedUntil: null, reservedBy: null },
      }),
    ]);

    this.events.emit('consultation.cancelled', {
      bookingId,
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      clientPhone: booking.clientPhone,
      refundAmount,
      refundPercent: refundAmount > 0 ? 100 : 0,
      reason: why,
      byConsultant: true,
    });
    return { refundAmount };
  }

  /** The consultant records that the client did not come, without waiting for the nightly check. */
  async markNoShow(bookingId: string, note?: string) {
    const booking = await this.db.consultationBooking.findUnique({ where: { id: bookingId }, include: { slot: true, consultant: true } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'CONFIRMED') throw new BadRequestException('Only a confirmed session can be marked as missed.');
    // Give the client ten minutes' grace before a session can be called missed.
    if (Date.now() < booking.slot.startAt.getTime() + 10 * 60 * 1000) {
      throw new BadRequestException('A session can be marked as missed from 10 minutes after its start time.');
    }
    await this.db.consultationBooking.update({
      where: { id: bookingId },
      data: { status: 'NO_SHOW', noShowAt: new Date(), ...(note?.trim() ? { caseNote: note.trim() } : {}) },
    });
    this.events.emit('consultation.no_show', {
      bookingId,
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      clientPhone: booking.clientPhone,
      consultantName: booking.consultant.name,
      sessionStart: booking.slot.startAt.toISOString(),
    });
    return { success: true };
  }

  // ── Availability rules CRUD ─────────────────────────────────────────────────

  async getAvailabilityRules(consultantId: string) {
    return this.db.consultantAvailabilityRule.findMany({
      where: { consultantId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async createAvailabilityRule(consultantId: string, dto: CreateAvailabilityRuleDto) {
    // Validate time format
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('startTime must be before endTime');
    }
    return this.db.consultantAvailabilityRule.create({
      data: { consultantId, dayOfWeek: dto.dayOfWeek, startTime: dto.startTime, endTime: dto.endTime, isActive: true },
    });
  }

  async updateAvailabilityRule(ruleId: string, dto: Partial<CreateAvailabilityRuleDto & { isActive: boolean }>) {
    return this.db.consultantAvailabilityRule.update({ where: { id: ruleId }, data: dto as any });
  }

  async deleteAvailabilityRule(ruleId: string) {
    return this.db.consultantAvailabilityRule.delete({ where: { id: ruleId } });
  }

  // ── Blocked times CRUD ──────────────────────────────────────────────────────

  async getBlockedTimes(consultantId: string) {
    return this.db.consultantBlockedTime.findMany({
      where: { consultantId, endAt: { gte: new Date() } },
      orderBy: { startAt: 'asc' },
    });
  }

  async createBlockedTime(consultantId: string, dto: CreateBlockedTimeDto) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (endAt <= startAt) throw new BadRequestException('endAt must be after startAt');

    // Cancel any AVAILABLE slots within this block
    const affected = await this.db.consultationSlot.updateMany({
      where: {
        consultantId,
        status: 'AVAILABLE',
        startAt: { gte: startAt, lt: endAt },
      },
      data: { status: 'CANCELLED' },
    });

    const block = await this.db.consultantBlockedTime.create({
      data: { consultantId, startAt, endAt, reason: dto.reason },
    });

    this.logger.log(`Blocked time created for ${consultantId}: cancelled ${affected.count} slot(s)`);
    return { ...block, cancelledSlots: affected.count };
  }

  async deleteBlockedTime(blockId: string) {
    return this.db.consultantBlockedTime.delete({ where: { id: blockId } });
  }

  // ── On-demand slot regeneration for a consultant ────────────────────────────

  async regenerateSlotsForConsultant(consultantId: string) {
    const consultant = await this.db.consultantProfile.findUnique({
      where: { id: consultantId },
      include: { availabilityRules: { where: { isActive: true } } },
    });
    if (!consultant) throw new NotFoundException('Consultant not found');

    const created = await this._generateSlotsForConsultant(consultant);
    return { created, consultantId };
  }

  // ── Admin: applications ─────────────────────────────────────────────────────

  async submitApplication(dto: SubmitApplicationDto) {
    return this.db.consultantApplication.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        consultationCategory: dto.consultationCategory as any,
        specialty: dto.specialty,
        licenseNumber: dto.licenseNumber,
        licenseBody: dto.licenseBody,
        bio: dto.bio,
        languages: dto.languages,
        yearsExperience: dto.yearsExperience,
        documentUrls: dto.documentUrls ?? [],
        status: 'PENDING',
      },
    });
  }

  async listApplications(status?: string) {
    return this.db.consultantApplication.findMany({
      where: status ? { status: status as any } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewApplication(id: string, adminId: string, dto: ReviewApplicationDto) {
    const application = await this.db.consultantApplication.update({
      where: { id },
      data: { status: dto.decision as any, reviewedBy: adminId, reviewNote: dto.reviewNote, reviewedAt: new Date() },
    });

    if (dto.decision === 'APPROVED') {
      await this.db.consultantProfile.create({
        data: {
          type: 'PARTNER',
          status: 'ACTIVE',
          consultationCategory: application.consultationCategory,
          name: application.name,
          bio: application.bio,
          specialty: application.specialty,
          languages: application.languages,
          licenseNumber: application.licenseNumber,
          licenseBody: application.licenseBody,
          priceUsd: 40,
          sessionDurationMins: 45,
          commissionRate: 0.25,
          isActive: true,
        },
      });
    }

    this.events.emit('consultant.application.reviewed', {
      applicationId: id,
      decision: dto.decision,
      applicantEmail: application.email,
      applicantName: application.name,
      reviewNote: dto.reviewNote,
    });

    return application;
  }

  // ── Admin: payouts ──────────────────────────────────────────────────────────

  async listPayouts(status?: string) {
    return this.db.consultantPayout.findMany({
      where: status ? { status: status as any } : {},
      include: { consultant: { select: { name: true, type: true } }, booking: { select: { clientName: true, completedAt: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markPayoutPaid(payoutId: string, dto: MarkPayoutPaidDto) {
    return this.db.consultantPayout.update({
      where: { id: payoutId },
      data: { status: 'PAID', paidAt: new Date(), paymentRef: dto.paymentRef },
    });
  }

  // ── Admin: get slots ─────────────────────────────────────────────────────────

  async getConsultantSlots(consultantId: string) {
    const from = new Date();
    return this.db.consultationSlot.findMany({
      where: { consultantId, startAt: { gte: from } },
      orderBy: { startAt: 'asc' },
    });
  }

  async deleteSlot(slotId: string) {
    const slot = await this.db.consultationSlot.findUnique({ where: { id: slotId } });
    if (!slot) throw new NotFoundException('Slot not found');
    if (slot.status === 'BOOKED') throw new BadRequestException('Cannot delete a booked slot');
    return this.db.consultationSlot.delete({ where: { id: slotId } });
  }

  // ── CRON: release expired slot holds (every 5 minutes) ─────────────────────

  @Cron('*/5 * * * *')
  async releaseExpiredHolds() {
    const { count } = await this.db.consultationSlot.updateMany({
      where: {
        status: 'RESERVED',
        reservedUntil: { lt: new Date() },
      },
      data: { status: 'AVAILABLE', reservedUntil: null, reservedBy: null },
    });
    if (count > 0) {
      this.logger.log(`[HoldCron] Released ${count} expired slot hold(s)`);
    }
  }

  // ── CRON: auto-expire no-shows (daily at 9AM UTC) ──────────────────────────

  @Cron('0 9 * * *')
  async autoExpireNoShows() {
    // Any CONFIRMED booking whose session ended 30+ minutes ago with no manual completion
    const cutoff = new Date(Date.now() - 30 * 60 * 1000);

    const stale = await this.db.consultationBooking.findMany({
      where: {
        status: 'CONFIRMED',
        slot: { startAt: { lt: cutoff } },
      },
      include: { slot: true, consultant: true },
    });

    for (const booking of stale) {
      const sessionEnd = new Date(booking.slot.startAt.getTime() + booking.slot.durationMinutes * 60 * 1000);
      if (sessionEnd > new Date(Date.now() - 30 * 60 * 1000)) continue; // not ended + 30m yet

      if (!booking.joinedAt) {
        // Client never joined — no-show
        await this.db.consultationBooking.update({
          where: { id: booking.id },
          data: { status: 'NO_SHOW', noShowAt: new Date() },
        });
        this.events.emit('consultation.no_show', {
          bookingId: booking.id,
          clientName: booking.clientName,
          clientEmail: booking.clientEmail,
          clientPhone: booking.clientPhone,
          consultantName: booking.consultant.name,
          sessionStart: booking.slot.startAt.toISOString(),
        });
        this.logger.log(`[NoShowCron] Marked booking ${booking.id} as NO_SHOW`);
      } else {
        // Client joined but session wasn't marked complete — auto-complete
        await this.db.consultationBooking.update({
          where: { id: booking.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
        await this.db.consultantProfile.update({
          where: { id: booking.consultantId },
          data: { sessionCount: { increment: 1 } },
        });
        if (booking.consultant.type === 'PARTNER') {
          const gross = Number(booking.amountPaid);
          const platformFee = Math.round(gross * Number(booking.consultant.commissionRate) * 100) / 100;
          const net = Math.round((gross - platformFee) * 100) / 100;
          await this.db.consultantPayout.upsert({
            where: { bookingId: booking.id },
            update: {},
            create: { consultantId: booking.consultantId, bookingId: booking.id, grossAmount: gross, platformFee, netAmount: net, status: 'PENDING' },
          });
        }
        this.events.emit('consultation.completed', { bookingId: booking.id });
        this.logger.log(`[NoShowCron] Auto-completed booking ${booking.id}`);
      }
    }
  }

  // ── CRON: auto-generate slots (daily at 5AM UTC) ────────────────────────────
  // Uses ConsultantAvailabilityRule records — falls back to default hours if none set.

  @Cron('0 5 * * *') // Daily at 05:00 UTC (was Monday-only)
  async autoGenerateSlots() {
    this.logger.log('[SlotCron] Running daily slot auto-generation');

    const consultants = await this.db.consultantProfile.findMany({
      where: { isActive: true, status: 'ACTIVE' },
      include: { availabilityRules: { where: { isActive: true } } },
    });

    let created = 0;
    for (const consultant of consultants) {
      created += await this._generateSlotsForConsultant(consultant);
    }

    this.logger.log(`[SlotCron] Auto-generated ${created} new slot(s) across ${consultants.length} consultants`);
  }

  // ── Internal: generate slots for one consultant (28-day rolling window) ─────

  private async _generateSlotsForConsultant(
    consultant: { id: string; timezone: string; sessionDurationMins: number; bufferMins: number; availabilityRules: Array<{ dayOfWeek: number; startTime: string; endTime: string }> },
  ): Promise<number> {
    const tz = consultant.timezone ?? 'UTC';
    const duration = consultant.sessionDurationMins ?? 45;
    const buffer = consultant.bufferMins ?? 15;
    const rules = consultant.availabilityRules ?? [];

    // Get UTC offset hours for this consultant's timezone
    const tzOffsetHours = (() => {
      try {
        const ref = new Date();
        const utcH = Number(ref.toLocaleString('en-US', { timeZone: 'UTC', hour: '2-digit', hour12: false }));
        const localH = Number(ref.toLocaleString('en-US', { timeZone: tz, hour: '2-digit', hour12: false }));
        return localH - utcH;
      } catch { return 0; }
    })();

    // Fetch blocked times for this consultant (next 28 days)
    const windowEnd = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000);
    const blockedTimes = await this.db.consultantBlockedTime.findMany({
      where: { consultantId: consultant.id, endAt: { gte: new Date() }, startAt: { lte: windowEnd } },
    });

    let created = 0;
    const now = new Date();

    for (let day = 1; day <= 28; day++) {
      const date = new Date(now);
      date.setDate(now.getDate() + day);
      const dow = date.getDay(); // 0=Sun

      let slotsForDay: Array<{ startTime: string; endTime: string }>;

      if (rules.length > 0) {
        // Use availability rules
        slotsForDay = rules.filter((r) => r.dayOfWeek === dow);
      } else {
        // Fallback: weekdays 08:00–17:00
        if (dow === 0 || dow === 6) continue;
        slotsForDay = [{ startTime: '08:00', endTime: '17:00' }];
      }

      for (const rule of slotsForDay) {
        const [startHour, startMin] = rule.startTime.split(':').map(Number);
        const [endHour, endMin] = rule.endTime.split(':').map(Number);
        const windowStartMins = startHour * 60 + startMin;
        const windowEndMins = endHour * 60 + endMin;

        // Generate slots within this window with buffer
        let currentMins = windowStartMins;
        while (currentMins + duration <= windowEndMins) {
          const localHour = Math.floor(currentMins / 60);
          const localMin = currentMins % 60;

          // Convert local time to UTC
          const startAt = new Date(date);
          startAt.setUTCHours(localHour - tzOffsetHours, localMin, 0, 0);

          // Skip if in the past
          if (startAt <= now) {
            currentMins += duration + buffer;
            continue;
          }

          // Skip if overlaps a blocked time
          const endAt = new Date(startAt.getTime() + duration * 60 * 1000);
          const blocked = blockedTimes.some((b) => startAt < b.endAt && endAt > b.startAt);
          if (blocked) {
            currentMins += duration + buffer;
            continue;
          }

          // Idempotent: skip if slot already exists
          const existing = await this.db.consultationSlot.findFirst({
            where: { consultantId: consultant.id, startAt },
          });
          if (!existing) {
            await this.db.consultationSlot.create({
              data: { consultantId: consultant.id, startAt, durationMinutes: duration, status: 'AVAILABLE' },
            });
            created++;
          }

          currentMins += duration + buffer;
        }
      }
    }

    return created;
  }
}
