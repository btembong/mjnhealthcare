import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TicketService } from './ticket.service';
import { TicketCategory, TicketStatus, TicketPriority, TicketAuthorRole } from '@mjn/database';

class CreateTicketDto {
  @IsString() subject: string;
  @IsEnum(TicketCategory) category: TicketCategory;
  @IsString() content: string;
}

class ReplyDto {
  @IsString() content: string;
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
  constructor(private readonly ticketService: TicketService) {}

  @ApiOperation({ summary: 'Create a support ticket' })
  @Post()
  create(@Body() dto: CreateTicketDto, @Req() req: any) {
    return this.ticketService.createTicket(req.user.id, dto.subject, dto.category, dto.content);
  }

  @ApiOperation({ summary: 'Get my tickets' })
  @Get('mine')
  getMine(@Req() req: any) {
    return this.ticketService.getMyTickets(req.user.id);
  }

  @ApiOperation({ summary: 'Get a ticket by id' })
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.ticketService.getTicket(id);
  }

  @ApiOperation({ summary: 'Reply to a ticket' })
  @Post(':id/reply')
  reply(@Param('id') id: string, @Body() dto: ReplyDto, @Req() req: any) {
    const person = req.user;
    const role =
      person.role === 'CANDIDATE' || person.role === 'STUDENT'
        ? TicketAuthorRole.CLIENT
        : person.role === 'ADMIN'
          ? TicketAuthorRole.ADMIN
          : TicketAuthorRole.CONSULTANT;
    return this.ticketService.replyToTicket(id, person.id, role, dto.content);
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
