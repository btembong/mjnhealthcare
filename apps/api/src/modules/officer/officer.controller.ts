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
import { IsString, IsEmail, MinLength, IsOptional, IsBoolean, IsArray } from 'class-validator';
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

  @IsOptional()
  @IsBoolean()
  keepCases?: boolean;
}

class ReassignCasesDto {
  @IsArray()
  @IsString({ each: true })
  engagementIds!: string[];

  @IsOptional()
  @IsString()
  officerId?: string | null;

  @IsOptional()
  @IsString()
  handoverNotes?: string;
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
  portal?: string;

  @IsOptional()
  @IsString()
  submittedAt?: string | null;

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
  nextActionDate?: string | null;
}

class RejectNoteDto {
  @IsOptional()
  @IsString()
  reason?: string;
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
      dto.keepCases ?? false,
    );
  }

  @ApiOperation({ summary: 'Reactivate a deactivated officer' })
  @AdminOnly()
  @Patch('admin/officers/:id/reactivate')
  reactivateOfficer(@Param('id') id: string) {
    return this.svc.reactivateOfficer(id);
  }

  @ApiOperation({ summary: 'Move several cases to one officer, or to none' })
  @AdminOnly()
  @Post('admin/officers/reassign')
  reassignCases(@Body() dto: ReassignCasesDto) {
    return this.svc.reassignCases(dto.engagementIds, dto.officerId || null, dto.handoverNotes);
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
  async addNote(
    @Param('id') engagementId: string,
    @Body() dto: AddNoteDto,
    @Req() req: any,
  ) {
    await this.access.assertEngagement(req.user, engagementId);
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
  async getNotes(@CurrentUser() user: AuthUser, @Param('id') engagementId: string) {
    await this.access.assertEngagement(user, engagementId);
    return this.svc.getCaseNotes(engagementId);
  }

  // Sign-off belongs to a consultant or an admin, never to the officer who wrote the update.
  @ApiOperation({ summary: 'Approve a pending client update note' })
  @RolesOnly('ADMIN', 'CONSULTANT')
  @Patch('officer/notes/:noteId/approve')
  async approveNote(@CurrentUser() user: AuthUser, @Param('noteId') noteId: string) {
    await this.access.assertEngagement(user, await this.svc.noteEngagementId(noteId));
    return this.svc.approveNote(noteId, user.id);
  }

  @ApiOperation({ summary: 'Reject a pending client update note' })
  @RolesOnly('ADMIN', 'CONSULTANT')
  @Patch('officer/notes/:noteId/reject')
  async rejectNote(@CurrentUser() user: AuthUser, @Param('noteId') noteId: string, @Body() dto: RejectNoteDto) {
    await this.access.assertEngagement(user, await this.svc.noteEngagementId(noteId));
    return this.svc.rejectNote(noteId, dto?.reason);
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
  getRecentOfficerNotes(@CurrentUser() user: AuthUser, @Query('limit') limit?: string) {
    return this.svc.getRecentOfficerNotes(user, limit ? parseInt(limit) : 20);
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
  async addTracking(
    @CurrentUser() user: AuthUser,
    @Param('id') engagementId: string,
    @Body() dto: AddTrackingDto,
  ) {
    await this.access.assertEngagement(user, engagementId);
    return this.svc.addTracking(engagementId, dto);
  }

  @ApiOperation({ summary: 'Get tracking entries for a case' })
  @StaffOnly()
  @Get('officer/cases/:id/tracking')
  async getTracking(@CurrentUser() user: AuthUser, @Param('id') engagementId: string) {
    await this.access.assertEngagement(user, engagementId);
    return this.svc.getTracking(engagementId);
  }

  @ApiOperation({ summary: 'Update a tracking entry' })
  @StaffOnly()
  @Patch('officer/cases/:id/tracking/:trackingId')
  async updateTracking(
    @CurrentUser() user: AuthUser,
    @Param('id') engagementId: string,
    @Param('trackingId') trackingId: string,
    @Body() dto: UpdateTrackingDto,
  ) {
    await this.access.assertEngagement(user, engagementId);
    return this.svc.updateTracking(engagementId, trackingId, dto);
  }

  // ── Escalation ────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Escalate a case to the assigned consultant' })
  @StaffOnly()
  @Post('officer/cases/:id/escalate')
  @HttpCode(HttpStatus.CREATED)
  async escalate(
    @Param('id') engagementId: string,
    @Body() dto: EscalateDto,
    @Req() req: any,
  ) {
    await this.access.assertEngagement(req.user, engagementId);
    return this.svc.escalate(
      engagementId,
      req.user.id,
      dto.consultantId,
      dto.reason,
    );
  }

  @ApiOperation({ summary: "Officer home: what to do first, what is coming up, what is with others" })
  @StaffOnly()
  @Get('officer/my-work')
  getMyWork(@Req() req: any) {
    return this.svc.getMyWork(req.user.id);
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
