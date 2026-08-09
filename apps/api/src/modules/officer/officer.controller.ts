import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, IsOptional, IsBoolean } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OfficerService } from './officer.service';

class CreateOfficerDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

class AssignOfficerDto {
  @IsOptional()
  @IsString()
  officerId?: string | null;

  @IsOptional()
  @IsString()
  handoverNotes?: string;
}

class AddNoteDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}

class AddTrackingDto {
  @IsString()
  portal!: string;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  submittedAt?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  nextActionDate?: string;
}

class UpdateTrackingDto {
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  nextActionDate?: string;
}

class EscalateDto {
  @IsString()
  consultantId!: string;

  @IsString()
  reason!: string;
}

class ResolveEscalationDto {
  @IsString()
  resolution!: string;
}

@ApiTags('officer')
@UseGuards(JwtAuthGuard)
@Controller()
export class OfficerController {
  constructor(private readonly svc: OfficerService) {}

  // ── Admin: officer management ─────────────────────────────────────────────

  @ApiOperation({ summary: 'List all processing officers' })
  @Get('admin/officers')
  listOfficers() {
    return this.svc.listOfficers();
  }

  @ApiOperation({ summary: 'Create a processing officer account' })
  @Post('admin/officers')
  createOfficer(@Body() dto: CreateOfficerDto) {
    return this.svc.createOfficer(dto);
  }

  @ApiOperation({ summary: 'Assign / unassign officer to engagement' })
  @Patch('engagements/:id/assign-officer')
  assignOfficer(
    @Param('id') engagementId: string,
    @Body() dto: AssignOfficerDto,
  ) {
    return this.svc.assignOfficer(engagementId, dto.officerId ?? null, dto.handoverNotes);
  }

  // ── Admin / Consultant: escalation inbox ──────────────────────────────────

  @ApiOperation({ summary: "Consultant's escalation inbox" })
  @Get('officer/escalations/inbox')
  getConsultantEscalations(@Req() req: any) {
    return this.svc.getConsultantEscalations(req.user.id);
  }

  @ApiOperation({ summary: 'Resolve an escalation' })
  @Patch('officer/escalations/:id/resolve')
  resolveEscalation(
    @Param('id') id: string,
    @Body() dto: ResolveEscalationDto,
  ) {
    return this.svc.resolveEscalation(id, dto.resolution);
  }

  // ── Officer: my caseload ──────────────────────────────────────────────────

  @ApiOperation({ summary: "Officer's assigned caseload" })
  @Get('officer/my-cases')
  getMyCases(@Req() req: any) {
    return this.svc.getMyCases(req.user.id);
  }

  @ApiOperation({ summary: 'Get a single assigned case detail' })
  @Get('officer/cases/:id')
  getCase(@Param('id') id: string, @Req() req: any) {
    return this.svc.getCaseById(id, req.user.id);
  }

  // ── Case Notes ────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Add a case note' })
  @Post('officer/cases/:id/notes')
  @HttpCode(HttpStatus.CREATED)
  addNote(
    @Param('id') engagementId: string,
    @Body() dto: AddNoteDto,
    @Req() req: any,
  ) {
    return this.svc.addCaseNote(
      engagementId,
      req.user.id,
      dto.content,
      dto.isInternal ?? true,
    );
  }

  @ApiOperation({ summary: 'Get case notes' })
  @Get('officer/cases/:id/notes')
  getNotes(@Param('id') engagementId: string) {
    return this.svc.getCaseNotes(engagementId);
  }

  // ── Application Tracking ─────────────────────────────────────────────────

  @ApiOperation({ summary: 'Add application tracking entry' })
  @Post('officer/cases/:id/tracking')
  @HttpCode(HttpStatus.CREATED)
  addTracking(
    @Param('id') engagementId: string,
    @Body() dto: AddTrackingDto,
  ) {
    return this.svc.addTracking(engagementId, dto);
  }

  @ApiOperation({ summary: 'Get tracking entries for a case' })
  @Get('officer/cases/:id/tracking')
  getTracking(@Param('id') engagementId: string) {
    return this.svc.getTracking(engagementId);
  }

  @ApiOperation({ summary: 'Update a tracking entry' })
  @Patch('officer/cases/:id/tracking/:trackingId')
  updateTracking(
    @Param('trackingId') trackingId: string,
    @Body() dto: UpdateTrackingDto,
  ) {
    return this.svc.updateTracking(trackingId, dto);
  }

  // ── Escalation ────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Escalate a case to the assigned consultant' })
  @Post('officer/cases/:id/escalate')
  @HttpCode(HttpStatus.CREATED)
  escalate(
    @Param('id') engagementId: string,
    @Body() dto: EscalateDto,
    @Req() req: any,
  ) {
    return this.svc.escalate(
      engagementId,
      req.user.id,
      dto.consultantId,
      dto.reason,
    );
  }

  @ApiOperation({ summary: "Officer's own escalation history" })
  @Get('officer/my-escalations')
  getEscalations(@Req() req: any) {
    return this.svc.getEscalations(req.user.id);
  }

  // ── Shared: officer activity feed (consultant + admin can call this) ───────

  @ApiOperation({ summary: 'Unified officer activity feed for an engagement' })
  @Get('engagements/:id/officer-activity')
  getOfficerActivity(@Param('id') engagementId: string) {
    return this.svc.getOfficerActivity(engagementId);
  }

  @ApiOperation({ summary: 'Application tracking for an engagement (portal-accessible)' })
  @Get('engagements/:id/tracking')
  getEngagementTracking(@Param('id') engagementId: string) {
    return this.svc.getEngagementTracking(engagementId);
  }
}
