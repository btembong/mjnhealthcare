import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
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

@Injectable()
export class ConsultationService {
  private readonly logger = new Logger(ConsultationService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly events: EventEmitter2,
    private readonly dailyCo: DailyCoService,
    private readonly refundService: RefundService,
    @InjectQueue('consultation-reminders') private readonly reminderQueue: Queue,
  ) {}

  // ── Public: list consultants ────────────────────────────────────────────────

  async getClientBookings(clientEmail: string) {
    return this.db.consultationBooking.findMany({
      where: { clientEmail },
      include: {
        slot: {
          include: {
            consultant: {
              select: { id: true, name: true, bio: true, photoUrl: true, specialty: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
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
      const slots = await tx.$queryRaw<Array<{ id: string; status: string; reservedUntil: Date | null }>>`
        SELECT id, status, "reservedUntil"
        FROM consultation_slots
        WHERE id = ${slotId}
        FOR UPDATE
      `;
      const slot = slots[0];
      if (!slot) throw new NotFoundException('Slot not found');

      const isAvailable =
        slot.status === 'AVAILABLE' ||
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

  // ── Public: initiate booking ─────────────────────────────────────────────────

  async initiateBooking(dto: BookConsultationDto) {
    const now = new Date();

    // Validate slot is available or held by this client
    const slot = await this.db.consultationSlot.findUnique({ where: { id: dto.slotId } });
    if (!slot) throw new NotFoundException('Slot not found');

    const heldByThisClient = slot.status === 'RESERVED' && slot.reservedBy === dto.clientEmail && slot.reservedUntil && slot.reservedUntil > now;
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
        (s.status === 'RESERVED' && s.reservedBy === dto.clientEmail && s.reservedUntil && s.reservedUntil > now) ||
        (s.status === 'RESERVED' && s.reservedUntil && s.reservedUntil < now);

      if (!stillOk) throw new ConflictException('Slot was just taken');

      await tx.consultationSlot.update({
        where: { id: dto.slotId },
        data: { status: 'BOOKED', reservedUntil: null, reservedBy: null },
      });
    });

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
        amountPaid: consultant.priceUsd,
      },
    });

    // ── DEV BYPASS ─────────────────────────────────────────────────────────────
    if (process.env.DEV_SKIP_PAYMENT === 'true') {
      this.logger.warn(`[DEV] Skipping Tranzak — auto-confirming booking ${booking.id}`);
      await this.handlePaymentConfirmed(booking.id);
      const devReturnUrl = dto.returnUrl
        ? `${dto.returnUrl}?bookingId=${booking.id}`
        : `${process.env.WEB_URL ?? 'http://localhost:3001'}/consult/confirmed?bookingId=${booking.id}`;
      return { bookingId: booking.id, redirectUrl: devReturnUrl };
    }

    // Initiate Tranzak payment
    const webUrl = process.env.WEB_URL ?? 'http://localhost:3001';
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
      // Release the slot back to available if payment initiation fails
      await this.db.consultationSlot.update({
        where: { id: dto.slotId },
        data: { status: 'AVAILABLE' },
      });
      this.logger.error(`Tranzak payment initiation error for booking ${booking.id}: ${err}`);
      throw new BadRequestException(
        err instanceof Error ? err.message : 'Payment could not be initiated. Please try again.',
      );
    }
  }

  // ── Webhook: payment confirmed ──────────────────────────────────────────────

  async handlePaymentConfirmed(bookingId: string) {
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
      data: { status: 'CONFIRMED', dailyRoomUrl, dailyRoomName },
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

    // Schedule extended reminder chain
    const now = Date.now();
    const sessionMs = booking.slot.startAt.getTime();

    const payload = {
      bookingId,
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      clientPhone: booking.clientPhone,
      consultantName: booking.consultant.name,
      sessionStart,
      roomUrl: dailyRoomUrl,
    };

    const reminders: Array<{ name: string; offsetMs: number }> = [
      { name: 'consultation-reminder-48h', offsetMs: 48 * 60 * 60 * 1000 },
      { name: 'consultation-reminder-2h',  offsetMs: 2  * 60 * 60 * 1000 },
      { name: 'consultation-reminder-15m', offsetMs: 15 * 60 * 1000 },
    ];

    for (const r of reminders) {
      const delay = sessionMs - r.offsetMs - now;
      if (delay > 0) {
        await this.reminderQueue.add(r.name, payload, { delay });
      }
    }

    // Consultant-side reminder 30 min before
    const consultantDelay = sessionMs - 30 * 60 * 1000 - now;
    if (consultantDelay > 0) {
      await this.reminderQueue.add('consultation-reminder-consultant', {
        ...payload,
        preSessionNote: booking.preSessionNote,
      }, { delay: consultantDelay });
    }
  }

  // ── Public: booking summary ──────────────────────────────────────────────────

  async getBookingSummary(bookingId: string) {
    const booking = await this.db.consultationBooking.findUnique({
      where: { id: bookingId },
      include: {
        consultant: { select: { name: true } },
        slot: { select: { startAt: true, durationMinutes: true } },
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
    };
  }

  // ── Public: Tranzak payment webhook ────────────────────────────────────────

  async handlePaymentWebhook(payload: any) {
    const bookingId =
      payload?.resource?.mchTransactionRef ??
      payload?.mchTransactionRef ??
      payload?.data?.mchTransactionRef ??
      payload?.customData?.bookingId;

    if (!bookingId) {
      this.logger.warn('Tranzak webhook: no bookingId found', JSON.stringify(payload));
      return;
    }

    const status =
      payload?.resource?.status ??
      payload?.status ??
      payload?.data?.status;
    if (status === 'SUCCESSFUL') {
      await this.handlePaymentConfirmed(bookingId);
    } else if (status && status !== 'PENDING' && status !== 'PROCESSING') {
      const booking = await this.db.consultationBooking.findUnique({
        where: { id: bookingId },
        include: { slot: { include: { consultant: { select: { name: true, priceUsd: true } } } } },
      });
      // Release the slot when payment fails
      if (booking?.slotId) {
        await this.db.consultationSlot.update({
          where: { id: booking.slotId },
          data: { status: 'AVAILABLE' },
        });
      }
      this.logger.warn(`Tranzak payment ${status} for booking ${bookingId}`);
      this.events.emit('consultation.payment_failed', {
        bookingId,
        clientName: booking?.clientName ?? 'Unknown',
        clientEmail: booking?.clientEmail ?? '',
        clientPhone: booking?.clientPhone ?? '',
        consultantName: booking?.slot?.consultant?.name ?? '—',
        amountUsd: Number(booking?.slot?.consultant?.priceUsd ?? 0),
        failReason: status,
        sessionStart: booking?.slot?.startAt?.toISOString() ?? '',
      });
    }
  }

  // ── Public: get join token ──────────────────────────────────────────────────

  async getJoinInfo(bookingId: string, email: string) {
    const booking = await this.db.consultationBooking.findUnique({
      where: { id: bookingId },
      include: { consultant: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.clientEmail !== email) throw new BadRequestException('Email does not match booking');
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
    if (booking.clientEmail !== clientEmail) throw new BadRequestException('Email does not match booking');
    if (!['CONFIRMED', 'AWAITING_PAYMENT'].includes(booking.status)) {
      throw new BadRequestException('Booking cannot be cancelled');
    }

    const refund = this.refundService.calculate(Number(booking.amountPaid), booking.slot.startAt);

    await this.db.$transaction([
      this.db.consultationBooking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED', refundAmount: refund.refundAmount, refundedAt: new Date() },
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
    });

    return { refundAmount: refund.refundAmount, refundPercent: refund.refundPercent };
  }

  // ── Admin: mark completed ───────────────────────────────────────────────────

  async markCompleted(bookingId: string) {
    const booking = await this.db.consultationBooking.findUnique({
      where: { id: bookingId },
      include: { consultant: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    await this.db.consultationBooking.update({
      where: { id: bookingId },
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
      await this.db.consultantPayout.create({
        data: { consultantId: booking.consultantId, bookingId, grossAmount: gross, platformFee, netAmount: net, status: 'PENDING' },
      });
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

  async listSessions(consultantId?: string, status?: string) {
    return this.db.consultationBooking.findMany({
      where: {
        ...(consultantId ? { slot: { consultantId } } : {}),
        ...(status ? { status: status as any } : {}),
      },
      include: {
        slot: {
          include: { consultant: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
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
