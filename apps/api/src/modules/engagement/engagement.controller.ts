import { Controller, Get, Post, Patch, Param, Body, UseGuards, HttpCode, HttpStatus, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EngagementService } from './engagement.service';

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
  constructor(private readonly engagementService: EngagementService) {}

  @ApiOperation({ summary: 'List all engagements (admin/consultant)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'CONSULTANT', 'COMPLIANCE')
  @Get()
  findAll() {
    return this.engagementService.findAll();
  }

  @ApiOperation({ summary: 'List engagements for a client' })
  @Get('client/:personId')
  findByClient(@Param('personId') personId: string) {
    return this.engagementService.findByClient(personId);
  }

  @ApiOperation({ summary: 'Get single engagement detail' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.engagementService.findById(id);
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
  sendSignature(@Param('id') id: string) {
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
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.engagementService.updateStatus(id, body.status);
  }

  @ApiOperation({ summary: 'Add a milestone to an engagement' })
  @Post(':id/milestones')
  addMilestone(@Param('id') id: string, @Body() dto: AddMilestoneDto) {
    return this.engagementService.addMilestone(id, dto.label);
  }

  @ApiOperation({ summary: 'Complete a milestone' })
  @Patch('milestones/:milestoneId/complete')
  completeMilestone(@Param('milestoneId') milestoneId: string) {
    return this.engagementService.completeMilestone(milestoneId);
  }

  @ApiOperation({ summary: 'Download signed engagement letter as PDF' })
  @Get(':id/letter-pdf')
  async downloadLetterPdf(@Param('id') id: string, @Res() res: Response) {
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
  sendMessage(@Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.engagementService.sendClientMessage(id, dto.message);
  }

  @ApiOperation({ summary: 'Send pathway-specific document checklist to client (email + chat)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'CONSULTANT')
  @Post(':id/send-checklist')
  sendDocumentChecklist(
    @Param('id') id: string,
    @Body() body: { pathwayKey: string },
    @Req() req: any,
  ) {
    return this.engagementService.sendDocumentChecklist(id, body.pathwayKey, req.user.id);
  }
}
