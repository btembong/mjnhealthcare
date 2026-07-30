import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StudentSupportService } from './student-support.service';

class CreateInternshipDto {
  @IsString() title!: string;
  @IsString() country!: string;
  @IsOptional() @IsString() field?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() duration?: string;
  @IsOptional() @IsString() stipend?: string;
  @IsOptional() closingDate?: Date;
}

class CreateUniversityProgramDto {
  @IsString() name!: string;
  @IsString() university!: string;
  @IsString() country!: string;
  @IsOptional() @IsString() field?: string;
  @IsOptional() @IsString() duration?: string;
  @IsOptional() @IsNumber() @Min(0) tuitionUsd?: number;
  @IsOptional() @IsString() applicationUrl?: string;
  @IsOptional() @IsString() description?: string;
}

class CreateWesApplicationDto {
  @IsString() personId!: string;
  @IsOptional() @IsString() engagementId?: string;
  @IsNumber() @Min(1) credentialCount!: number;
  @IsOptional() @IsBoolean() isRush?: boolean;
}

@ApiTags('student-support')
@Controller('student-support')
export class StudentSupportController {
  constructor(private readonly svc: StudentSupportService) {}

  // ── Candidate-facing ─────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Browse open internship placements' })
  @Get('internships')
  getInternships(@Query('country') country?: string, @Query('field') field?: string) {
    return this.svc.getInternships({ country, field });
  }

  @ApiOperation({ summary: 'Get a single internship' })
  @Get('internships/:id')
  getInternship(@Param('id') id: string) {
    return this.svc.getInternshipById(id);
  }

  @ApiOperation({ summary: 'Apply for an internship' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('internships/:id/apply')
  applyForInternship(@Param('id') id: string, @Body() body: { personId: string }) {
    return this.svc.applyForInternship(body.personId, id);
  }

  @ApiOperation({ summary: 'Get all internship applications for a person' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('internship-applications/:personId')
  getInternshipApplications(@Param('personId') personId: string) {
    return this.svc.getInternshipApplicationsByPerson(personId);
  }

  @ApiOperation({ summary: 'Browse university programs' })
  @Get('university-programs')
  getUniversityPrograms(@Query('country') country?: string, @Query('field') field?: string) {
    return this.svc.getUniversityPrograms({ country, field });
  }

  @ApiOperation({ summary: 'Submit a WES evaluation application' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('wes')
  createWesApplication(@Body() dto: CreateWesApplicationDto) {
    return this.svc.createWesApplication(dto);
  }

  @ApiOperation({ summary: 'Get WES applications for a person' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('wes/:personId')
  getWesApplications(@Param('personId') personId: string) {
    return this.svc.getWesApplicationsByPerson(personId);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create an internship placement (admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('admin/internships')
  createInternship(@Body() dto: CreateInternshipDto) {
    return this.svc.createInternship(dto);
  }

  @ApiOperation({ summary: 'Update an internship placement (admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('admin/internships/:id')
  updateInternship(@Param('id') id: string, @Body() dto: Partial<CreateInternshipDto>) {
    return this.svc.updateInternship(id, dto as any);
  }

  @ApiOperation({ summary: 'List all internship applications (admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('admin/internship-applications')
  getAllInternshipApplications(@Query('status') status?: string) {
    return this.svc.getAllInternshipApplications({ status });
  }

  @ApiOperation({ summary: 'Update internship application status (admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('admin/internship-applications/:id/status')
  updateInternshipApplicationStatus(
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string },
  ) {
    return this.svc.updateInternshipApplicationStatus(id, body.status, body.notes);
  }

  @ApiOperation({ summary: 'Create a university program (admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('admin/university-programs')
  createUniversityProgram(@Body() dto: CreateUniversityProgramDto) {
    return this.svc.createUniversityProgram(dto);
  }

  @ApiOperation({ summary: 'Update a university program (admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('admin/university-programs/:id')
  updateUniversityProgram(@Param('id') id: string, @Body() dto: Partial<CreateUniversityProgramDto>) {
    return this.svc.updateUniversityProgram(id, dto as any);
  }
}
