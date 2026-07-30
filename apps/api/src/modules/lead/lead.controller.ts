import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeadService } from './lead.service';

class CreateLeadDto {
  @IsString() name!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() profession?: string;
  @IsOptional() @IsString() destination?: string;
  @IsOptional() @IsString() serviceInterest?: string;
  @IsOptional() @IsString() notes?: string;
}

class BookConsultationDto {
  @IsString() name!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() profession?: string;
  @IsOptional() @IsString() destination?: string;
  @IsOptional() @IsString() serviceInterest?: string;
  @IsString() slotId!: string;
  @IsOptional() @IsString() selectedServices?: string; // JSON array of selected service labels
  @IsOptional() @IsString() estimate?: string;         // formatted total e.g. "$1,250"
  @IsOptional() @IsString() lang?: string;             // "en" | "fr"
}

class UpdateLeadDto {
  @IsString() status!: string;
  @IsOptional() @IsString() assignedConsultantId?: string;
}

@ApiTags('leads')
@Controller('leads')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @ApiOperation({ summary: 'Submit a lead / interest form (public — no auth required)' })
  @Post()
  create(@Body() dto: CreateLeadDto) {
    return this.leadService.createLead(dto);
  }

  @ApiOperation({ summary: 'Book a free consultation slot (public — no auth required)' })
  @Post('book-consultation')
  bookConsultation(@Body() dto: BookConsultationDto) {
    return this.leadService.bookConsultation(dto);
  }

  @ApiOperation({ summary: 'List all leads (admin / consultant)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('status') status?: string) {
    return this.leadService.findAll(status ? { status } : undefined);
  }

  @ApiOperation({ summary: 'Update lead status / assign consultant (admin / consultant)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.leadService.updateStatus(id, dto.status, dto.assignedConsultantId);
  }

  @ApiOperation({ summary: 'Mark lead as converted to engagement (admin / consultant)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/convert')
  convert(@Param('id') id: string, @Body() body: { personId: string }) {
    return this.leadService.convertToEngagement(id, body.personId);
  }
}
