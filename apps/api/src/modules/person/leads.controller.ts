import {
  Controller, Get, Patch, Post, Param, Body, Query,
  UseGuards, NotFoundException, BadRequestException, HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DatabaseService } from '@mjn/database';
import { EventEmitter2 } from '@nestjs/event-emitter';

@ApiTags('leads')
@Controller('leads')
export class LeadsController {
  constructor(
    private readonly db: DatabaseService,
    private readonly events: EventEmitter2,
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
    const slot = await this.db.bookingSlot.findUnique({ where: { id: body.slotId } });
    if (!slot) throw new NotFoundException('Slot not found');
    if (slot.isBooked) throw new BadRequestException('This slot is no longer available — please choose another time.');

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
          status: 'FREE_CONSULT_BOOKED' as any,
        },
      });
    }

    // Create booking record + mark slot as booked
    const booking = await this.db.booking.create({
      data: { leadId: lead.id, slotId: body.slotId, type: 'FREE_CONSULTATION', status: 'CONFIRMED' },
    });
    await this.db.bookingSlot.update({ where: { id: body.slotId }, data: { isBooked: true } });
    await this.db.lead.update({ where: { id: lead.id }, data: { sourceBookingId: booking.id } });

    this.events.emit('lead.free_consult_booked', {
      leadId: lead.id,
      leadName: body.name.trim(),
      leadEmail: body.email.trim().toLowerCase(),
      leadPhone: body.phone,
      slotStart: slot.startTime.toISOString(),
      serviceInterest: body.serviceInterest,
    });

    return { name: body.name.trim(), email: body.email.trim().toLowerCase(), slotStart: slot.startTime.toISOString() };
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
