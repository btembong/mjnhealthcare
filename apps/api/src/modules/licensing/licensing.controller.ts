import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LicensingService } from './licensing.service';

class StageDto {
  @IsString() label: string;
  @IsOptional() @IsString() description?: string;
  order: number;
  @IsArray() @IsString({ each: true }) requiredDocs: string[];
}

class CreatePathwayDto {
  @IsString() country: string;
  @IsString() regulatoryBody: string;
  @IsOptional() @IsString() profession?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => StageDto) stages: StageDto[];
}

class InitProgressDto {
  @IsString() personId: string;
  @IsString() engagementId: string;
  @IsString() pathwayId: string;
}

@ApiTags('licensing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('licensing')
export class LicensingController {
  constructor(private readonly licensingService: LicensingService) {}

  @ApiOperation({ summary: 'List pathways, optionally filtered by country / profession' })
  @ApiQuery({ name: 'country', required: false })
  @ApiQuery({ name: 'profession', required: false })
  @Get('pathways')
  getPathways(@Query('country') country?: string, @Query('profession') profession?: string) {
    return this.licensingService.getPathways(country, profession);
  }

  @ApiOperation({ summary: 'Create a licensing pathway (admin)' })
  @Post('pathways')
  createPathway(@Body() dto: CreatePathwayDto) {
    return this.licensingService.createPathway(dto);
  }

  @ApiOperation({ summary: 'Delete a licensing pathway (admin)' })
  @Delete('pathways/:id')
  deletePathway(@Param('id') id: string) {
    return this.licensingService.deletePathway(id);
  }

  @ApiOperation({ summary: 'Initialise client progress on a pathway' })
  @Post('progress')
  initProgress(@Body() dto: InitProgressDto) {
    return this.licensingService.initProgress(dto.personId, dto.engagementId, dto.pathwayId);
  }

  @ApiOperation({ summary: 'Get client licensing progress' })
  @Get('progress/:personId/:engagementId')
  getProgress(@Param('personId') personId: string, @Param('engagementId') engagementId: string) {
    return this.licensingService.getClientProgress(personId, engagementId);
  }

  @ApiOperation({ summary: 'Advance client to next stage' })
  @Patch('progress/:id/advance')
  advance(@Param('id') id: string, @Body() body: { nextStageId: string }) {
    return this.licensingService.advanceStage(id, body.nextStageId);
  }
}
