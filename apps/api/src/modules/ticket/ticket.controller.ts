import { CurrentUser, AuthUser, RolesOnly, isAdmin, isStaff } from '../auth/access';
import { AccessService } from '../auth/access.service';
import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ComplianceService } from '../compliance/compliance.service';
import { TicketService } from './ticket.service';
import { TicketCategory, TicketStatus, TicketPriority, TicketAuthorRole } from '@mjn/database';

class AttachmentDto {
  @IsString() key: string;
  @IsString() name: string;
  @IsOptional() @IsString() type?: string;
}

class CreateTicketDto {
  @IsString() @MaxLength(200) subject: string;
  @IsEnum(TicketCategory) category: TicketCategory;
  @IsString() @MaxLength(5000) content: string;
  @IsOptional() @ValidateNested() @Type(() => AttachmentDto) attachment?: AttachmentDto;
}

class ReplyDto {
  @IsOptional() @IsString() @MaxLength(5000) content?: string;
  @IsOptional() @ValidateNested() @Type(() => AttachmentDto) attachment?: AttachmentDto;
  /** Staff only: a note the client never sees. */
  @IsOptional() @IsBoolean() internal?: boolean;
  /** Staff only: send the reply and mark the request solved. */
  @IsOptional() @IsBoolean() solve?: boolean;
}

class AssignDto {
  @IsOptional() @IsString() staffId?: string | null;
}

class UrgentDto {
  @IsBoolean() urgent: boolean;
}

/** The staff who work support requests. Which requests each may see is decided per request. */
const SupportStaff = () => RolesOnly('ADMIN', 'CONSULTANT', 'PROCESSING_OFFICER');

class AttachmentUploadDto {
  @IsString() fileName: string;
}

class UpdateStatusDto {
  @IsEnum(TicketStatus) status: TicketStatus;
  @IsString() @IsOptional() assignedConsultantId?: string;
}

class UpdatePriorityDto {
  @IsEnum(TicketPriority) priority: TicketPriority;
}

@ApiTags('tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketController {
  constructor(
    private readonly ticketService: TicketService,
    private readonly access: AccessService,
    private readonly compliance: ComplianceService,
  ) {}

  @ApiOperation({ summary: 'Create a support ticket' })
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTicketDto) {
    return this.ticketService.createTicket(user.id, dto.subject, dto.category, dto.content, dto.attachment);
  }

  @ApiOperation({ summary: 'Get my tickets' })
  @Get('mine')
  getMine(@CurrentUser() user: AuthUser) {
    return this.ticketService.getMyTickets(user.id);
  }

  @ApiOperation({ summary: 'Get a short-lived link to upload a file for a support message' })
  @Post('attachment-url')
  getAttachmentUploadUrl(@CurrentUser() user: AuthUser, @Body() dto: AttachmentUploadDto) {
    return this.ticketService.getAttachmentUploadUrl(user.id, dto.fileName);
  }

  @ApiOperation({ summary: "Get a short-lived link to open a support message's file" })
  @Get('replies/:replyId/attachment-url')
  async getAttachmentViewUrl(@CurrentUser() user: AuthUser, @Param('replyId') replyId: string) {
    await this.access.assertTicket(user, await this.ticketService.replyTicketId(replyId));
    // Checked before anything is logged or signed: a client cannot open a staff note's file.
    await this.ticketService.getAttachmentViewUrl(replyId, isStaff(user));
    await this.compliance.logAuditEvent({
      actorId: user.id,
      action: 'ticket_attachment_viewed',
      resourceType: 'ticket_reply',
      resourceId: replyId,
    });
    return this.ticketService.getAttachmentViewUrl(replyId, isStaff(user));
  }

  @ApiOperation({ summary: 'Staff a request can be assigned to' })
  @SupportStaff()
  @Get('staff/assignees')
  assignees() {
    return this.ticketService.assignableStaff();
  }

  @ApiOperation({ summary: 'Get a ticket by id' })
  @Get(':id')
  async getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.access.assertTicket(user, id);
    return this.ticketService.getTicket(id, isStaff(user));
  }

  @ApiOperation({ summary: 'Reply to a ticket' })
  @Post(':id/reply')
  async reply(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ReplyDto) {
    await this.access.assertTicket(user, id);
    // Anyone who is not staff is writing as the client.
    const role = !isStaff(user) ? TicketAuthorRole.CLIENT : isAdmin(user) ? TicketAuthorRole.ADMIN : TicketAuthorRole.CONSULTANT;
    const staff = isStaff(user);
    return this.ticketService.replyToTicket(id, user.id, role, dto.content ?? '', dto.attachment, {
      internal: staff && dto.internal === true,
      solve: staff && dto.solve === true,
    });
  }

  @ApiOperation({ summary: 'Client: record that the request has been opened and read' })
  @Post(':id/seen')
  @HttpCode(HttpStatus.OK)
  async seen(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.access.assertTicket(user, id);
    return this.ticketService.markSeenByClient(id, user.id);
  }

  @ApiOperation({ summary: 'Mark a request as solved (the client, or staff)' })
  @Post(':id/solve')
  @HttpCode(HttpStatus.OK)
  async solve(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.access.assertTicket(user, id);
    return this.ticketService.solveByClient(id);
  }

  // Admin routes
  @ApiOperation({ summary: 'The staff inbox: requests this member of staff may see' })
  @SupportStaff()
  @Get()
  async getAll(@CurrentUser() user: AuthUser) {
    // Admins see everything. Consultants and officers see their own clients' requests, and no privacy requests.
    const scope = isAdmin(user) ? null : await this.access.consultantScope(user);
    if (!isAdmin(user) && !scope) return [];
    return this.ticketService.listForStaff(scope ? { canSeePerson: (id) => scope.canSeePerson(id) } : null);
  }

  @ApiOperation({ summary: 'Mark solved, or reopen' })
  @SupportStaff()
  @Patch(':id/status')
  async updateStatus(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateStatusDto) {
    await this.access.assertTicket(user, id);
    return this.ticketService.updateTicketStatus(id, dto.status);
  }

  @ApiOperation({ summary: 'Give the request to a member of staff, or to nobody' })
  @SupportStaff()
  @Patch(':id/assign')
  async assign(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AssignDto) {
    await this.access.assertTicket(user, id);
    return this.ticketService.assign(id, dto.staffId || null);
  }

  @ApiOperation({ summary: 'Flag or unflag as urgent' })
  @SupportStaff()
  @Patch(':id/urgent')
  async setUrgent(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UrgentDto) {
    await this.access.assertTicket(user, id);
    return this.ticketService.setUrgent(id, dto.urgent);
  }
}
