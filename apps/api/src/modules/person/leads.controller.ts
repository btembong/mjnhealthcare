import {
  Controller, Get, Patch, Post, Param, Body, Query,
  UseGuards, NotFoundException, BadRequestException, HttpCode, Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DatabaseService } from '@mjn/database';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { DailyCoService } from '../consultation/daily-co.service';

@ApiTags('leads')
@Controller('leads')
export class LeadsController {
  private readonly logger = new Logger(LeadsController.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly events: EventEmitter2,
    @InjectQueue('booking-reminders') private readonly reminderQueue: Queue,
    private readonly dailyCo: DailyCoService,
  ) {}

  // ── Public endpoint — no auth (called from /get-started) ─────────────────

  @Post('book-consultation')
  @HttpCode(200)
  async bookFreeConsultation(@Body() body: {
    name: string;
    email: string;
    phone?: string;
    profession?: string;
    destination?: string;
    serviceInterest?: string;
    slotId: string;
    lang?: string;
    refCode?: string;
    selectedServices?: string;
    estimate?: string;
  }) {
    const slot = await this.db.bookingSlot.findUnique({
      where: { id: body.slotId },
      include: { consultant: { select: { id: true, name: true, email: true, photoUrl: true } } },
    });
    if (!slot) throw new NotFoundException('Slot not found');
    // Atomically claim the slot so two people can't grab the same time.
    const claimed = await this.db.bookingSlot.updateMany({
      where: { id: body.slotId, isBooked: false },
      data: { isBooked: true },
    });
    if (claimed.count === 0) {
      throw new BadRequestException('This slot is no longer available — please choose another time.');
    }

    // Context carried over from the pricing page — saved to the lead's notes so the
    // consultant sees what the client was looking at.
    const noteParts: string[] = [];
    if (body.estimate) noteParts.push(`Estimate: ${body.estimate}`);
    if (body.selectedServices) noteParts.push(`Services: ${body.selectedServices}`);
    if (body.lang && body.lang !== 'en') noteParts.push(`Language preference: ${body.lang}`);
    const notes = noteParts.length ? noteParts.join(' | ') : undefined;

    // Create or update lead
    const existingLead = await this.db.lead.findFirst({ where: { email: body.email } });
    let lead: any;
    if (existingLead) {
      lead = await this.db.lead.update({
        where: { id: existingLead.id },
        data: {
          status: 'FREE_CONSULT_BOOKED' as any,
          ...(body.profession ? { profession: body.profession } : {}),
          ...(body.destination ? { destination: body.destination } : {}),
          ...(body.serviceInterest ? { serviceInterest: body.serviceInterest } : {}),
          ...(body.refCode ? { refCode: body.refCode } : {}),
          ...(notes ? { notes } : {}),
          updatedAt: new Date(),
        },
      });
    } else {
      lead = await this.db.lead.create({
        data: {
          name: body.name.trim(),
          email: body.email.trim().toLowerCase(),
          phone: body.phone?.trim() || null,
          profession: body.profession || null,
          destination: body.destination || null,
          serviceInterest: body.serviceInterest || null,
          refCode: body.refCode || null,
          ...(notes ? { notes } : {}),
          status: 'FREE_CONSULT_BOOKED' as any,
        },
      });
    }

    // Create booking record + mark slot as booked
    const booking = await this.db.booking.create({
      data: { leadId: lead.id, slotId: body.slotId, type: 'FREE_CONSULTATION', status: 'CONFIRMED' },
    });
    await this.db.lead.update({ where: { id: lead.id }, data: { sourceBookingId: booking.id } });

    // Create the video room. Best-effort: if Daily.co is down the booking still
    // succeeds — the advisor can share a link manually as a fallback.
    const FREE_CONSULT_MINUTES = 15;
    let roomUrl = '';
    let hostUrl = '';
    try {
      const room = await this.dailyCo.createRoom(booking.id, slot.startTime, FREE_CONSULT_MINUTES);
      roomUrl = room.url;
      const consultantName = (slot as any).consultant?.name ?? 'Advisor';
      const hostToken = await this.dailyCo.createMeetingToken(room.name, true, consultantName);
      hostUrl = `${room.url}?t=${hostToken}`;
    } catch (err) {
      this.logger.error(`Could not create Daily.co room for free consult ${booking.id}: ${err}`);
    }

    // Schedule reminders for both client and consultant
    const slotMs = slot.startTime.getTime();
    const reminderJobData = {
      leadName: body.name.trim(),
      leadEmail: body.email.trim().toLowerCase(),
      leadPhone: body.phone,
      consultantName: (slot as any).consultant?.name,
      consultantEmail: (slot as any).consultant?.email,
      slotStart: slot.startTime.toISOString(),
      roomUrl,
      hostUrl,
    };
    const reminderSchedule = [
      { name: 'free-consult-reminder-24h', offset: 24 * 60 * 60 * 1000 },
      { name: 'free-consult-reminder-1h',  offset: 60 * 60 * 1000 },
      { name: 'free-consult-reminder-15m', offset: 15 * 60 * 1000 },
    ];
    // Best-effort: never block the booking response on the reminder queue. If Redis
    // is unreachable the booking (+ lead + notifications) still completes; reminders
    // are non-critical and simply won't be scheduled.
    void (async () => {
      try {
        for (const { name, offset } of reminderSchedule) {
          const delay = slotMs - offset - Date.now();
          if (delay > 0) await this.reminderQueue.add(name, reminderJobData, { delay });
        }
      } catch (err) {
        this.logger.warn(`Could not schedule free-consult reminders for ${body.email}: ${err}`);
      }
    })();

    this.events.emit('lead.free_consult_booked', {
      leadId: lead.id,
      leadName: body.name.trim(),
      leadEmail: body.email.trim().toLowerCase(),
      leadPhone: body.phone,
      slotStart: slot.startTime.toISOString(),
      serviceInterest: body.serviceInterest,
      consultantId: (slot as any).consultant?.id,
      consultantName: (slot as any).consultant?.name,
      consultantEmail: (slot as any).consultant?.email,
      roomUrl,
      hostUrl,
    });

    return {
      bookingId: booking.id,
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      slotStart: slot.startTime.toISOString(),
      consultant: (slot as any).consultant ?? null,
      roomUrl: roomUrl || null,
    };
  }

  // ── Public: issue a guest token so the client can enter the private room ───

  @Get('free-consult/join')
  async joinFreeConsult(
    @Query('bookingId') bookingId: string,
    @Query('email') email: string,
  ) {
    if (!bookingId || !email) throw new BadRequestException('bookingId and email are required');

    const booking = await this.db.booking.findUnique({
      where: { id: bookingId },
      include: { lead: { select: { email: true, name: true } } },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    // Verify the requester owns this booking
    const leadEmail = (booking as any).lead?.email ?? '';
    if (leadEmail.toLowerCase() !== email.trim().toLowerCase()) {
      throw new BadRequestException('Email does not match this booking');
    }

    const roomName = `mjn-consult-${bookingId}`;
    const guestName = (booking as any).lead?.name ?? 'Guest';

    try {
      const token = await this.dailyCo.createMeetingToken(roomName, false, guestName);
      const roomUrl = `https://mjnhealthcare.daily.co/${roomName}`;
      return { url: `${roomUrl}?t=${token}` };
    } catch (err) {
      this.logger.error(`Could not issue guest token for booking ${bookingId}: ${err}`);
      throw new BadRequestException('Could not generate join link. The session may have ended.');
    }
  }

  // ── Authenticated routes ──────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONSULTANT', 'PROCESSING_OFFICER')
  @ApiBearerAuth()
  @Get()
  findAll(@Query('status') status?: string, @Query('search') search?: string) {
    return this.db.lead.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONSULTANT', 'PROCESSING_OFFICER')
  @ApiBearerAuth()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const lead = await this.db.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONSULTANT', 'PROCESSING_OFFICER')
  @ApiBearerAuth()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { status?: string; notes?: string; assignedConsultantId?: string; discountCode?: string },
  ) {
    const lead = await this.db.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');
    return this.db.lead.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status as any } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.assignedConsultantId !== undefined ? { assignedConsultantId: body.assignedConsultantId } : {}),
        ...(body.discountCode !== undefined ? { discountCode: body.discountCode } : {}),
        updatedAt: new Date(),
      },
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONSULTANT', 'PROCESSING_OFFICER')
  @ApiBearerAuth()
  @Post(':id/stage')
  async advanceStage(@Param('id') id: string, @Body() body: { stage: string; notes?: string }) {
    const lead = await this.db.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');
    const updated = await this.db.lead.update({
      where: { id },
      data: { status: body.stage as any, ...(body.notes ? { notes: body.notes } : {}), updatedAt: new Date() },
    });
    this.events.emit('lead.stage_changed', { leadId: id, stage: body.stage, leadEmail: lead.email, leadName: lead.name });
    return updated;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PROCESSING_OFFICER')
  @ApiBearerAuth()
  @Post(':id/convert')
  async convertToEngagement(@Param('id') id: string, @Body() body: { sendInviteEmail?: boolean }) {
    const lead = await this.db.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.status === 'CONVERTED') throw new BadRequestException('Lead already converted');

    // Check if Person already exists
    let person = await this.db.person.findUnique({ where: { email: lead.email } });
    if (!person) {
      person = await this.db.person.create({
        data: {
          name: lead.name,
          email: lead.email,
          phone: lead.phone ?? '',
          locale: 'en',
        },
      });
    }

    // Create a stub Engagement linked to this person (consultantId to be assigned in admin)
    const engagement = await this.db.engagement.create({
      data: {
        personId: person.id,
        consultantId: 'PENDING_ASSIGNMENT',
        status: 'ACTIVE' as any,
      },
    });

    await this.db.lead.update({
      where: { id },
      data: { status: 'CONVERTED' as any, convertedPersonId: person.id, updatedAt: new Date() },
    });

    if (body.sendInviteEmail !== false) {
      this.events.emit('lead.conversion_complete', {
        leadId: id,
        personId: person.id,
        engagementId: engagement.id,
        leadName: lead.name,
        leadEmail: lead.email,
        leadPhone: lead.phone,
      });
    }

    return { personId: person.id, engagementId: engagement.id };
  }
}
