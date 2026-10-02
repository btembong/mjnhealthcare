import {
  Controller, Get, Patch, Post, Param, Body, Query,
  UseGuards, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DatabaseService } from '@mjn/database';
import { EventEmitter2 } from '@nestjs/event-emitter';

@ApiTags('leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'CONSULTANT', 'PROCESSING_OFFICER')
@Controller('leads')
export class LeadsController {
  constructor(
    private readonly db: DatabaseService,
    private readonly events: EventEmitter2,
  ) {}

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

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const lead = await this.db.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

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

  @Post(':id/convert')
  @Roles('ADMIN', 'PROCESSING_OFFICER')
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
