import { StaffOnly, CurrentUser, AuthUser } from '../auth/access';
import { AccessService } from '../auth/access.service';
import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, HttpCode, HttpStatus, Req, Res, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EngagementService } from './engagement.service';
import { EngagementOverviewService } from './engagement-overview.service';

const STATUSES = ['PENDING_SIGNATURE', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'TERMINATED'];

class CreateEngagementDto {
  @IsString()
  personId: string;

  @IsString()
  @IsOptional()
  consultantId?: string;
}

class AssignConsultantDto {
  @IsString()
  consultantId: string;
}

class AddMilestoneDto {
  @IsString()
  label: string;
}

class SendMessageDto {
  @IsString()
  message: string;
}

@ApiTags('engagements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('engagements')
export class EngagementController {
  constructor(
    private readonly engagementService: EngagementService,
    private readonly overviewService: EngagementOverviewService,
    private readonly access: AccessService,
  ) {}

  @ApiOperation({ summary: 'List all engagements (admin/consultant)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'CONSULTANT', 'COMPLIANCE')
  @Get()
  async findAll(@CurrentUser() user: AuthUser) {
    const engagements = await this.engagementService.findAll();
    const scope = await this.access.consultantScope(user);
    return scope ? engagements.filter((e: any) => scope.canSeeEngagement(e)) : engagements;
  }

  // Declared before ':id' so 'overview' is not read as an engagement id.
  @ApiOperation({ summary: 'Caseload: each case with its stage, what it is waiting on and last activity' })
  @StaffOnly()
  @Get('overview')
  async overview(
    @CurrentUser() user: AuthUser,
    @Query('chip') chip?: string,
    @Query('status') status?: string,
    @Query('consultant') consultant?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('view') view?: string,
  ) {
    const scope = await this.access.consultantScope(user);
    return this.overviewService.overview(
      { chip, status, consultant, q, page: Number(page), pageSize: Number(pageSize), view },
      scope,
    );
  }

  @ApiOperation({ summary: 'List engagements for a client' })
  @Get('client/:personId')
  async findByClient(@CurrentUser() user: AuthUser, @Param('personId') personId: string) {
    await this.access.assertPerson(user, personId);
    return this.engagementService.findByClient(personId);
  }

  @ApiOperation({ summary: 'Get single engagement detail' })
  @Get(':id')
  async findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.access.assertEngagement(user, id);
    return this.engagementService.findById(id);
  }

  @ApiOperation({ summary: 'One case: stage, what it is waiting on and last activity' })
  @StaffOnly()
  @Get(':id/summary')
  async summary(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.access.assertEngagement(user, id);
    return this.overviewService.summary(id);
  }

  @ApiOperation({ summary: 'Create engagement and assign consultant' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'CONSULTANT')
  @Post()
  create(@Body() dto: CreateEngagementDto) {
    return this.engagementService.create(dto);
  }

  @ApiOperation({ summary: 'Assign or reassign consultant to engagement' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/assign-consultant')
  assignConsultant(@Param('id') id: string, @Body() dto: AssignConsultantDto) {
    return this.engagementService.assignConsultant(id, dto.consultantId);
  }

  @ApiOperation({ summary: 'Send engagement letter sign-link email to client' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'CONSULTANT')
  @Post(':id/send-signature')
  async sendSignature(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.access.assertEngagement(user, id);
    return this.engagementService.sendSignatureEmail(id);
  }

  @ApiOperation({ summary: 'Client self-signs the engagement letter' })
  @HttpCode(HttpStatus.OK)
  @Post(':id/sign')
  signLetter(@Param('id') id: string, @Req() req: any) {
    const personId: string = req.user?.sub ?? req.user?.id ?? '';
    const ip: string =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      req.socket?.remoteAddress ??
      'unknown';
    const userAgent: string = req.headers['user-agent'] ?? '';
    return this.engagementService.signLetter(id, personId, ip, userAgent);
  }

  @ApiOperation({ summary: 'Update engagement status' })
  @StaffOnly()
  @Patch(':id/status')
  async updateStatus(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: { status: string; reason?: string }) {
    await this.access.assertEngagement(user, id);
    if (!STATUSES.includes(body.status)) throw new BadRequestException('Unknown status.');
    return this.engagementService.updateStatus(id, body.status, user.id, body.reason);
  }

  @ApiOperation({ summary: 'Add a milestone to an engagement' })
  @StaffOnly()
  @Post(':id/milestones')
  async addMilestone(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AddMilestoneDto) {
    await this.access.assertEngagement(user, id);
    return this.engagementService.addMilestone(id, dto.label);
  }

  @ApiOperation({ summary: 'Complete a milestone' })
  @StaffOnly()
  @Patch('milestones/:milestoneId/complete')
  async completeMilestone(@CurrentUser() user: AuthUser, @Param('milestoneId') milestoneId: string) {
    await this.access.assertMilestone(user, milestoneId);
    return this.engagementService.completeMilestone(milestoneId);
  }

  @ApiOperation({ summary: 'Download signed engagement letter as PDF' })
  @Get(':id/letter-pdf')
  async downloadLetterPdf(@CurrentUser() user: AuthUser, @Param('id') id: string, @Res() res: Response) {
    await this.access.assertEngagement(user, id);
    const buffer = await this.engagementService.generateLetterPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="engagement-letter-${id.slice(-6).toUpperCase()}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @ApiOperation({ summary: 'Client sends a message to their consultant' })
  @Post(':id/message')
  async sendMessage(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: SendMessageDto) {
    await this.access.assertEngagement(user, id);
    return this.engagementService.sendClientMessage(id, dto.message);
  }

  @ApiOperation({ summary: 'Send pathway-specific document checklist to client (email + chat)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'CONSULTANT')
  @Post(':id/send-checklist')
  async sendDocumentChecklist(@CurrentUser() user: AuthUser, 
    @Param('id') id: string,
    @Body() body: { pathwayKey: string },
    @Req() req: any,
  ) {
    await this.access.assertEngagement(user, id);
    return this.engagementService.sendDocumentChecklist(id, body.pathwayKey, req.user.id);
  }
}
