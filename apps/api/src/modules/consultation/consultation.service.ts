import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
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
      },
      orderBy: [{ rating: 'desc' }, { sessionCount: 'desc' }],
    });
  }

  // ── Public: available slots for a consultant ────────────────────────────────

  async getAvailableSlots(consultantId: string) {
    const from = new Date();
    const to = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // next 14 days
    return this.db.consultationSlot.findMany({
      where: {
        consultantId,
        status: 'AVAILABLE',
        startAt: { gte: from, lte: to },
      },
      orderBy: { startAt: 'asc' },
    });
  }

  // ── Public: initiate booking (holds slot, creates booking, returns payment URL) ─

  async initiateBooking(dto: BookConsultationDto) {
    const slot = await this.db.consultationSlot.findUnique({ where: { id: dto.slotId } });
    if (!slot || slot.status !== 'AVAILABLE') {
      throw new BadRequestException('Slot is no longer available');
    }

    const consultant = await this.db.consultantProfile.findUnique({
      where: { id: slot.consultantId },
    });
    if (!consultant || !consultant.isActive) {
      throw new BadRequestException('Consultant not available');
    }

    // Hold the slot
    await this.db.consultationSlot.update({ where: { id: dto.slotId }, data: { status: 'BOOKED' } });

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

    // Event emitted after payment URL is obtained so we can include it in the email

    // ── DEV BYPASS ─────────────────────────────────────────────────────────────
    // Set DEV_SKIP_PAYMENT=true in .env to auto-confirm bookings locally
    // without needing a real Tranzak redirect or webhook.
    if (process.env.DEV_SKIP_PAYMENT === 'true') {
      this.logger.warn(`[DEV] Skipping Tranzak — auto-confirming booking ${booking.id}`);
      await this.handlePaymentConfirmed(booking.id);
      return {
        bookingId: booking.id,
        redirectUrl: `${process.env.PORTAL_URL ?? 'http://localhost:3002'}/bookings/confirmed?bookingId=${booking.id}`,
      };
    }

    // Initiate Tranzak payment
    const returnUrl = `${process.env.PORTAL_URL ?? 'http://localhost:3002'}/bookings/confirmed?bookingId=${booking.id}`;
    const notifyUrl = `${process.env.API_URL ?? 'http://localhost:3000'}/api/v1/consultations/webhook/payment`;

    try {
      const authRes = await fetch(`${process.env.TRANZAK_BASE_URL ?? 'https://sandbox.dsapi.tranzak.me'}/auth/token`, {
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

      const payRes = await fetch(`${process.env.TRANZAK_BASE_URL ?? 'https://sandbox.dsapi.tranzak.me'}/xp021/v1/request/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: Number(consultant.priceUsd),
          currencyCode: 'USD',
          description: `MJN Healthcare — ${dto.consultationCategory} Consultation with ${consultant.name}`,
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

      // Emit now so the email includes the direct payment link
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
    if (!booking || booking.status !== 'AWAITING_PAYMENT') return;

    // Create Daily.co room
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

    this.events.emit('consultation.confirmed', {
      bookingId,
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      clientPhone: booking.clientPhone,
      consultantName: booking.consultant.name,
      sessionStart: booking.slot.startAt.toISOString(),
      durationMins: booking.slot.durationMinutes,
      roomUrl: dailyRoomUrl,
      category: booking.consultationCategory,
      recordingConsent: booking.recordingConsent,
    });

    // Schedule BullMQ reminders
    const now = Date.now();
    const sessionMs = booking.slot.startAt.getTime();

    const delay24h = sessionMs - 24 * 60 * 60 * 1000 - now;
    const delay1h = sessionMs - 60 * 60 * 1000 - now;

    const payload = {
      bookingId,
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      clientPhone: booking.clientPhone,
      consultantName: booking.consultant.name,
      sessionStart: booking.slot.startAt.toISOString(),
      roomUrl: dailyRoomUrl,
    };

    if (delay24h > 0) {
      await this.reminderQueue.add('consultation-reminder-24h', payload, { delay: delay24h });
    }
    if (delay1h > 0) {
      await this.reminderQueue.add('consultation-reminder-1h', payload, { delay: delay1h });
    }
  }

  // ── Public: booking summary (status check for confirmed page) ──────────────

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
    // Tranzak sends mchTransactionRef = booking.id (set at payment creation).
    // Some sandbox responses nest under .data; fall back to legacy customData.
    const bookingId =
      payload?.mchTransactionRef ??
      payload?.data?.mchTransactionRef ??
      payload?.customData?.bookingId;

    if (!bookingId) {
      this.logger.warn('Tranzak webhook: no bookingId found', JSON.stringify(payload));
      return;
    }

    const status = payload?.status ?? payload?.data?.status;
    if (status === 'SUCCESSFUL') {
      await this.handlePaymentConfirmed(bookingId);
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
    if (!booking.dailyRoomName) throw new BadRequestException('Video room not yet created');

    const token = await this.dailyCo.createMeetingToken(
      booking.dailyRoomName,
      false,
      booking.clientName,
    );
    return { roomUrl: booking.dailyRoomUrl, token, consultantName: booking.consultant.name };
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

    const refund = this.refundService.calculate(
      Number(booking.amountPaid),
      booking.slot.startAt,
    );

    await this.db.$transaction([
      this.db.consultationBooking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          refundAmount: refund.refundAmount,
          refundedAt: new Date(),
        },
      }),
      this.db.consultationSlot.update({
        where: { id: booking.slotId },
        data: { status: 'AVAILABLE' },
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

    // Update consultant stats
    await this.db.consultantProfile.update({
      where: { id: booking.consultantId },
      data: { sessionCount: { increment: 1 } },
    });

    // Create payout for PARTNER consultants
    if (booking.consultant.type === 'PARTNER') {
      const gross = Number(booking.amountPaid);
      const platformFee = Math.round(gross * Number(booking.consultant.commissionRate) * 100) / 100;
      const net = Math.round((gross - platformFee) * 100) / 100;

      await this.db.consultantPayout.create({
        data: {
          consultantId: booking.consultantId,
          bookingId,
          grossAmount: gross,
          platformFee,
          netAmount: net,
          status: 'PENDING',
        },
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
        commissionRate: dto.commissionRate ?? 0.25,
        status: 'ACTIVE',
        isActive: true,
      },
    });
  }

  async updateConsultant(id: string, dto: UpdateConsultantDto) {
    return this.db.consultantProfile.update({ where: { id }, data: dto as any });
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

  async listAllConsultants() {
    return this.db.consultantProfile.findMany({
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
          include: {
            consultant: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
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
      data: {
        status: dto.decision as any,
        reviewedBy: adminId,
        reviewNote: dto.reviewNote,
        reviewedAt: new Date(),
      },
    });

    if (dto.decision === 'APPROVED') {
      // Create an active PARTNER consultant profile from the application
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
          priceUsd: 40, // default — admin sets the real price after
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

  // ── Admin: get slots for a consultant ───────────────────────────────────────

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

  // ── Cron: auto-generate slots every Monday at 6 AM ─────────────────────────
  // Fills the next 14 days for every active consultant.
  // Skips weekends and slots that already exist at that time.
  // Default hours: 08:00, 10:00, 13:00, 15:00, 17:00 WAT (UTC+1 → stored as UTC-1h)

  @Cron('0 5 * * 1') // Every Monday at 05:00 UTC (06:00 WAT)
  async autoGenerateSlots() {
    this.logger.log('[SlotCron] Running weekly slot auto-generation');

    const consultants = await this.db.consultantProfile.findMany({
      where: { isActive: true, status: 'ACTIVE' },
      select: { id: true, name: true, sessionDurationMins: true },
    });

    // Default slot hours in WAT (UTC+1) — stored as UTC offset
    const SLOT_HOURS_WAT = [8, 10, 13, 15, 17];
    const DURATION = 45;
    let created = 0;

    const now = new Date();

    for (const consultant of consultants) {
      const duration = consultant.sessionDurationMins ?? DURATION;

      for (let day = 1; day <= 14; day++) {
        const date = new Date(now);
        date.setDate(now.getDate() + day);
        const dow = date.getDay();
        if (dow === 0 || dow === 6) continue; // skip weekends

        for (const hourWAT of SLOT_HOURS_WAT) {
          // Convert WAT (UTC+1) to UTC
          const startAt = new Date(date);
          startAt.setUTCHours(hourWAT - 1, 0, 0, 0);

          // Check if slot already exists
          const existing = await this.db.consultationSlot.findFirst({
            where: { consultantId: consultant.id, startAt },
          });
          if (existing) continue;

          await this.db.consultationSlot.create({
            data: { consultantId: consultant.id, startAt, durationMinutes: duration },
          });
          created++;
        }
      }
    }

    this.logger.log(`[SlotCron] Auto-generated ${created} new slots for ${consultants.length} consultants`);
  }
}
