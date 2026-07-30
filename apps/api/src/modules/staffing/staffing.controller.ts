import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StaffingService } from './staffing.service';

class CreateOpportunityDto {
  @IsString() partnerId!: string;
  @IsString() title!: string;
  @IsString() country!: string;
  @IsOptional() @IsString() profession?: string;
  @IsString() type!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() requirements?: string;
  @IsOptional() @IsString() salaryRange?: string;
  @IsOptional() closingDate?: Date;
}

class UpdateApplicationStatusDto {
  @IsEnum(['SUBMITTED', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'REJECTED', 'WITHDRAWN'])
  status!: string;
  @IsOptional() @IsString() notes?: string;
}

@ApiTags('staffing')
@Controller('staffing')
export class StaffingController {
  constructor(private readonly staffingService: StaffingService) {}

  // ── Public / Candidate ───────────────────────────────────────────────────

  @ApiOperation({ summary: 'Browse active job opportunities' })
  @Get('opportunities')
  getOpportunities(
    @Query('country') country?: string,
    @Query('profession') profession?: string,
  ) {
    return this.staffingService.getOpportunities({ country, profession });
  }

  @ApiOperation({ summary: 'Get a single opportunity' })
  @Get('opportunities/:id')
  getOpportunity(@Param('id') id: string) {
    return this.staffingService.getOpportunityById(id);
  }

  @ApiOperation({ summary: 'Apply to an opportunity' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('opportunities/:id/apply')
  apply(@Param('id') id: string, @Body() body: { personId: string }) {
    return this.staffingService.applyToOpportunity(body.personId, id);
  }

  @ApiOperation({ summary: 'Get all applications for a person' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('applications/:personId')
  getMyApplications(@Param('personId') personId: string) {
    return this.staffingService.getApplicationsByPerson(personId);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a job opportunity (admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('admin/opportunities')
  createOpportunity(@Body() dto: CreateOpportunityDto) {
    return this.staffingService.createOpportunity(dto);
  }

  @ApiOperation({ summary: 'Update an opportunity (admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('admin/opportunities/:id')
  updateOpportunity(@Param('id') id: string, @Body() dto: Partial<CreateOpportunityDto>) {
    return this.staffingService.updateOpportunity(id, dto as any);
  }

  @ApiOperation({ summary: 'Delete an opportunity (admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('admin/opportunities/:id')
  deleteOpportunity(@Param('id') id: string) {
    return this.staffingService.deleteOpportunity(id);
  }

  @ApiOperation({ summary: 'List all applications (admin) — filterable by status and opportunity' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('admin/applications')
  getAllApplications(
    @Query('status') status?: string,
    @Query('opportunityId') opportunityId?: string,
  ) {
    return this.staffingService.getAllApplications({ status, opportunityId });
  }

  @ApiOperation({ summary: 'Update application status (admin) — shortlist, offer, reject, etc.' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('admin/applications/:id/status')
  updateApplicationStatus(@Param('id') id: string, @Body() dto: UpdateApplicationStatusDto) {
    return this.staffingService.updateApplicationStatus(id as any, dto.status as any, dto.notes);
  }

  @ApiOperation({ summary: 'Mark candidate as deployed (admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('admin/deploy')
  markDeployed(@Body() body: { personId: string; opportunityId: string }) {
    return this.staffingService.markDeployed(body.personId, body.opportunityId);
  }
}
