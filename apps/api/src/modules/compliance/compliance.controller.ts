import { RolesOnly, CurrentUser, AuthUser } from '../auth/access';
import { AccessService } from '../auth/access.service';
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
  constructor(
    private readonly complianceService: ComplianceService,
    private readonly access: AccessService,
  ) {}

  @ApiOperation({ summary: 'Get audit log (admin)' })
  @ApiQuery({ name: 'resourceType', required: false })
  @ApiQuery({ name: 'resourceId', required: false })
  @RolesOnly('ADMIN', 'COMPLIANCE')
  @Get('audit-log')
  getAuditLog(
    @Query('resourceType') resourceType?: string,
    @Query('resourceId') resourceId?: string,
  ) {
    return this.complianceService.getAuditLog({ resourceType, resourceId });
  }

  @ApiOperation({ summary: 'Record consent (privacy policy, marketing, ToS)' })
  @Post('consent')
  async recordConsent(@CurrentUser() user: AuthUser, @Body() dto: RecordConsentDto) {
    await this.access.assertPerson(user, dto.personId);
    return this.complianceService.recordConsent(dto.personId, dto.type, dto.ipAddress);
  }

  @ApiOperation({ summary: 'Record POA / Letter of Authorisation' })
  @Post('poa')
  async recordPoa(@CurrentUser() user: AuthUser, @Body() dto: RecordPoaDto) {
    await Promise.all([this.access.assertPerson(user, dto.personId), this.access.assertEngagement(user, dto.engagementId)]);
    return this.complianceService.recordPoa(dto.engagementId, dto.personId, dto.documentUrl);
  }
}
