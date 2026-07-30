import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ComplianceService } from './compliance.service';

class RecordConsentDto {
  @IsString() personId: string;
  @IsEnum(['privacy_policy', 'marketing', 'terms_of_service']) type: string;
  @IsString() ipAddress: string;
}

class RecordPoaDto {
  @IsString() engagementId: string;
  @IsString() personId: string;
  @IsString() documentUrl: string;
}

@ApiTags('compliance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @ApiOperation({ summary: 'Get audit log (admin)' })
  @ApiQuery({ name: 'resourceType', required: false })
  @ApiQuery({ name: 'resourceId', required: false })
  @Get('audit-log')
  getAuditLog(
    @Query('resourceType') resourceType?: string,
    @Query('resourceId') resourceId?: string,
  ) {
    return this.complianceService.getAuditLog({ resourceType, resourceId });
  }

  @ApiOperation({ summary: 'Record consent (privacy policy, marketing, ToS)' })
  @Post('consent')
  recordConsent(@Body() dto: RecordConsentDto) {
    return this.complianceService.recordConsent(dto.personId, dto.type, dto.ipAddress);
  }

  @ApiOperation({ summary: 'Record POA / Letter of Authorisation' })
  @Post('poa')
  recordPoa(@Body() dto: RecordPoaDto) {
    return this.complianceService.recordPoa(dto.engagementId, dto.personId, dto.documentUrl);
  }
}
