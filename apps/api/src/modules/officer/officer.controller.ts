import { StaffOnly, AdminOnly, RolesOnly, CurrentUser, AuthUser } from '../auth/access';
import { AccessService } from '../auth/access.service';
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  Query,
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

class UpdateOfficerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
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

  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;
}

class SetAvailabilityDto {
  @IsBoolean()
  isAvailable!: boolean;

  @IsOptional()
  @IsString()
  reassignToOfficerId?: string | null;
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
  @IsOptional()
  @IsString()
  consultantId?: string;

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
  constructor(
    private readonly svc: OfficerService,
    private readonly access: AccessService,
  ) {}

  // ── Admin: officer management ─────────────────────────────────────────────

  @ApiOperation({ summary: 'List all processing officers' })
  @StaffOnly()
  @Get('admin/officers')
  listOfficers() {
    return this.svc.listOfficers();
  }

  @ApiOperation({ summary: 'Create a processing officer account' })
  @AdminOnly()
  @Post('admin/officers')
  createOfficer(@Body() dto: CreateOfficerDto) {
    return this.svc.createOfficer(dto);
  }

  @ApiOperation({ summary: 'Update officer profile' })
  @AdminOnly()
  @Patch('admin/officers/:id')
  updateOfficer(@Param('id') id: string, @Body() dto: UpdateOfficerDto) {
    return this.svc.updateOfficer(id, dto);
  }

  @ApiOperation({ summary: 'Deactivate officer and unassign all cases' })
  @AdminOnly()
  @Delete('admin/officers/:id')
  deactivateOfficer(@Param('id') id: string) {
    return this.svc.deactivateOfficer(id);
  }

  @ApiOperation({ summary: 'Set officer availability + optionally bulk reassign' })
  @AdminOnly()
  @Patch('admin/officers/:id/availability')
  setAvailability(
    @Param('id') officerId: string,
    @Body() dto: SetAvailabilityDto,
  ) {
    return this.svc.setOfficerAvailability(
      officerId,
      dto.isAvailable,
      dto.reassignToOfficerId,
    );
  }

  @ApiOperation({ summary: 'Assign / unassign officer to engagement' })
  @RolesOnly('ADMIN', 'CONSULTANT')
  @Patch('engagements/:id/assign-officer')
  async assignOfficer(@CurrentUser() user: AuthUser, 
    @Param('id') engagementId: string,
    @Body() dto: AssignOfficerDto,
  ) {
    await this.access.assertEngagement(user, engagementId);
    return this.svc.assignOfficer(engagementId, dto.officerId ?? null, dto.handoverNotes);
  }

  // ── Admin / Consultant: escalation inbox ──────────────────────────────────

  @ApiOperation({ summary: "Consultant's escalation inbox" })
  @StaffOnly()
  @Get('officer/escalations/inbox')
  getConsultantEscalations(@Req() req: any) {
    return this.svc.getConsultantEscalations(req.user.id);
  }

  @ApiOperation({ summary: 'Resolve an escalation' })
  @StaffOnly()
  @Patch('officer/escalations/:id/resolve')
  resolveEscalation(
    @Param('id') id: string,
    @Body() dto: ResolveEscalationDto,
  ) {
    return this.svc.resolveEscalation(id, dto.resolution);
  }

  // ── Officer: my caseload ──────────────────────────────────────────────────

  @ApiOperation({ summary: "Officer's assigned caseload" })
  @StaffOnly()
  @Get('officer/my-cases')
  getMyCases(@Req() req: any) {
    return this.svc.getMyCases(req.user.id);
  }

  @ApiOperation({ summary: 'Get a single assigned case detail' })
  @StaffOnly()
  @Get('officer/cases/:id')
  getCase(@Param('id') id: string, @Req() req: any) {
    return this.svc.getCaseById(id, req.user.id);
  }

  // ── Case Notes ────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Add a case note' })
  @StaffOnly()
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
      dto.requiresApproval ?? false,
    );
  }

  @ApiOperation({ summary: 'Get case notes' })
  @StaffOnly()
  @Get('officer/cases/:id/notes')
  getNotes(@Param('id') engagementId: string) {
    return this.svc.getCaseNotes(engagementId);
  }

  @ApiOperation({ summary: 'Approve a pending client update note' })
  @StaffOnly()
  @Patch('officer/notes/:noteId/approve')
  approveNote(@Param('noteId') noteId: string, @Req() req: any) {
    return this.svc.approveNote(noteId, req.user.id);
  }

  @ApiOperation({ summary: 'Reject a pending client update note' })
  @StaffOnly()
  @Patch('officer/notes/:noteId/reject')
  rejectNote(@Param('noteId') noteId: string) {
    return this.svc.rejectNote(noteId);
  }

  @ApiOperation({ summary: 'Get pending approval notes for consultant' })
  @StaffOnly()
  @Get('officer/pending-approvals')
  getPendingApprovals(@Req() req: any) {
    return this.svc.getPendingApprovals(req.user);
  }

  @ApiOperation({ summary: 'Recent officer notes across all cases (admin view)' })
  @StaffOnly()
  @Get('officer/recent-notes')
  getRecentOfficerNotes(@Query('limit') limit?: string) {
    return this.svc.getRecentOfficerNotes(limit ? parseInt(limit) : 20);
  }

  @ApiOperation({ summary: 'Client-facing updates for an engagement' })
  @Get('engagements/:id/client-updates')
  async getClientUpdates(@CurrentUser() user: AuthUser, @Param('id') engagementId: string) {
    await this.access.assertEngagement(user, engagementId);
    return this.svc.getClientUpdates(engagementId);
  }

  // ── Application Tracking ─────────────────────────────────────────────────

  @ApiOperation({ summary: 'Add application tracking entry' })
  @StaffOnly()
  @Post('officer/cases/:id/tracking')
  @HttpCode(HttpStatus.CREATED)
  addTracking(
    @Param('id') engagementId: string,
    @Body() dto: AddTrackingDto,
  ) {
    return this.svc.addTracking(engagementId, dto);
  }

  @ApiOperation({ summary: 'Get tracking entries for a case' })
  @StaffOnly()
  @Get('officer/cases/:id/tracking')
  getTracking(@Param('id') engagementId: string) {
    return this.svc.getTracking(engagementId);
  }

  @ApiOperation({ summary: 'Update a tracking entry' })
  @StaffOnly()
  @Patch('officer/cases/:id/tracking/:trackingId')
  updateTracking(
    @Param('trackingId') trackingId: string,
    @Body() dto: UpdateTrackingDto,
  ) {
    return this.svc.updateTracking(trackingId, dto);
  }

  // ── Escalation ────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Escalate a case to the assigned consultant' })
  @StaffOnly()
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

  @ApiOperation({ summary: "Officer dashboard — stats + cases + activity" })
  @StaffOnly()
  @Get('officer/my-dashboard')
  getMyDashboard(@Req() req: any) {
    return this.svc.getMyDashboard(req.user.id);
  }

  @ApiOperation({ summary: "Officer's own escalation history" })
  @StaffOnly()
  @Get('officer/my-escalations')
  getEscalations(@Req() req: any) {
    return this.svc.getEscalations(req.user.id);
  }

  // ── Shared: officer activity feed (consultant + admin can call this) ───────

  @ApiOperation({ summary: 'Unified officer activity feed for an engagement' })
  @StaffOnly()
  @Get('engagements/:id/officer-activity')
  async getOfficerActivity(@CurrentUser() user: AuthUser, @Param('id') engagementId: string) {
    await this.access.assertEngagement(user, engagementId);
    return this.svc.getOfficerActivity(engagementId);
  }

  @ApiOperation({ summary: 'Application tracking for an engagement (portal-accessible)' })
  @Get('engagements/:id/tracking')
  async getEngagementTracking(@CurrentUser() user: AuthUser, @Param('id') engagementId: string) {
    await this.access.assertEngagement(user, engagementId);
    return this.svc.getEngagementTracking(engagementId);
  }
}
