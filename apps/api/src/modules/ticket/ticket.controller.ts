import { CurrentUser, AuthUser, isAdmin, isStaff } from '../auth/access';
import { AccessService } from '../auth/access.service';
import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MaxLength, ValidateNested } from 'class-validator';
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
}

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
    await this.compliance.logAuditEvent({
      actorId: user.id,
      action: 'ticket_attachment_viewed',
      resourceType: 'ticket_reply',
      resourceId: replyId,
    });
    return this.ticketService.getAttachmentViewUrl(replyId);
  }

  @ApiOperation({ summary: 'Get a ticket by id' })
  @Get(':id')
  async getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.access.assertTicket(user, id);
    return this.ticketService.getTicket(id);
  }

  @ApiOperation({ summary: 'Reply to a ticket' })
  @Post(':id/reply')
  async reply(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ReplyDto) {
    await this.access.assertTicket(user, id);
    // Anyone who is not staff is writing as the client.
    const role = !isStaff(user) ? TicketAuthorRole.CLIENT : isAdmin(user) ? TicketAuthorRole.ADMIN : TicketAuthorRole.CONSULTANT;
    return this.ticketService.replyToTicket(id, user.id, role, dto.content ?? '', dto.attachment);
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
  @ApiOperation({ summary: 'List all tickets (admin/consultant)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'CONSULTANT')
  @Get()
  getAll(@Query('status') status?: TicketStatus) {
    return this.ticketService.getAllTickets(status);
  }

  @ApiOperation({ summary: 'Update ticket status' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'CONSULTANT')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.ticketService.updateTicketStatus(id, dto.status, dto.assignedConsultantId);
  }

  @ApiOperation({ summary: 'Update ticket priority' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'CONSULTANT')
  @Patch(':id/priority')
  updatePriority(@Param('id') id: string, @Body() dto: UpdatePriorityDto) {
    return this.ticketService.updatePriority(id, dto.priority);
  }
}
