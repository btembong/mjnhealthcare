import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject, IsDateString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CampaignService } from './campaign.service';
import { CampaignStatus } from '@mjn/database';

class CreateCampaignDto {
  @IsString() name: string;
  @IsString() subject: string;
  @IsString() body: string;
  @IsObject() @IsOptional() audienceFilter?: Record<string, any>;
  @IsDateString() @IsOptional() scheduledAt?: string;
}

class UpdateCampaignDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() subject?: string;
  @IsString() @IsOptional() body?: string;
  @IsDateString() @IsOptional() scheduledAt?: string;
  @IsObject() @IsOptional() audienceFilter?: Record<string, any>;
}

@ApiTags('campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @ApiOperation({ summary: 'List campaigns' })
  @Get()
  list(@Query('status') status?: CampaignStatus) {
    return this.campaignService.listCampaigns(status);
  }

  @ApiOperation({ summary: 'Get one campaign' })
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.campaignService.getCampaign(id);
  }

  @ApiOperation({ summary: 'Create a campaign draft' })
  @Post()
  create(@Body() dto: CreateCampaignDto, @Req() req: any) {
    return this.campaignService.createCampaign({
      ...dto,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      createdById: req.user.id,
    });
  }

  @ApiOperation({ summary: 'Update a campaign draft' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.campaignService.updateCampaign(id, {
      ...dto,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
    });
  }

  @ApiOperation({ summary: 'Send campaign immediately' })
  @Post(':id/send')
  sendNow(@Param('id') id: string) {
    return this.campaignService.sendNow(id);
  }

  @ApiOperation({ summary: 'Cancel campaign' })
  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.campaignService.cancelCampaign(id);
  }
}
