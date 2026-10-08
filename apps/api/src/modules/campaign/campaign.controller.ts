import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req, Header,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsObject, IsDateString, IsEnum, IsArray, IsInt, Min, Max,
  ValidateNested, ArrayMaxSize, IsEmail, Matches, ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CampaignService } from './campaign.service';
import { CampaignStatus } from '@mjn/database';

class RecurrenceDto {
  @IsEnum(['DAILY', 'WEEKLY', 'MONTHLY']) frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  @IsArray() @IsInt({ each: true }) @Min(0, { each: true }) @Max(6, { each: true }) @ArrayMaxSize(7)
  @IsOptional() daysOfWeek?: number[];
  @IsInt() @Min(1) @Max(31) @IsOptional() dayOfMonth?: number;
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/) timeOfDay: string;
  @IsString() @IsOptional() timezone?: string;
  @ValidateIf((o) => o.endsAt !== null) @IsDateString() @IsOptional() endsAt?: string | null;
  @ValidateIf((o) => o.maxRuns !== null) @IsInt() @Min(1) @IsOptional() maxRuns?: number | null;
}

class CreateCampaignDto {
  @IsString() name: string;
  @IsString() subject: string;
  @IsString() body: string;
  @IsObject() @IsOptional() audienceFilter?: Record<string, any>;
  @ValidateIf((o) => o.scheduledAt !== null) @IsDateString() @IsOptional() scheduledAt?: string | null;
  @ValidateIf((o) => o.recurrence !== null) @ValidateNested() @Type(() => RecurrenceDto) @IsOptional()
  recurrence?: RecurrenceDto | null;
}

class UpdateCampaignDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() subject?: string;
  @IsString() @IsOptional() body?: string;
  @IsObject() @IsOptional() audienceFilter?: Record<string, any>;
  @ValidateIf((o) => o.scheduledAt !== null) @IsDateString() @IsOptional() scheduledAt?: string | null;
  @ValidateIf((o) => o.recurrence !== null) @ValidateNested() @Type(() => RecurrenceDto) @IsOptional()
  recurrence?: RecurrenceDto | null;
}

class CreateContactListDto {
  @IsString() name: string;
  @IsArray() contacts: any[];
}

class AudienceCountDto {
  @IsObject() audienceFilter: Record<string, any>;
}

class TestSendDto {
  @IsEmail() email: string;
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

  // Static routes must stay above ':id'.

  @ApiOperation({ summary: 'List saved contact lists' })
  @Get('lists')
  listContactLists() {
    return this.campaignService.listContactLists();
  }

  @ApiOperation({ summary: 'Save an imported contact list' })
  @Post('lists')
  createContactList(@Body() dto: CreateContactListDto, @Req() req: any) {
    return this.campaignService.createContactList({ ...dto, createdById: req.user.id });
  }

  @ApiOperation({ summary: 'Delete a saved contact list' })
  @Delete('lists/:listId')
  deleteContactList(@Param('listId') listId: string) {
    return this.campaignService.deleteContactList(listId);
  }

  @ApiOperation({ summary: 'Count recipients for an audience' })
  @Post('audience/count')
  countAudience(@Body() dto: AudienceCountDto) {
    return this.campaignService.countAudience(dto.audienceFilter);
  }

  @ApiOperation({ summary: 'Get one campaign' })
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.campaignService.getCampaign(id);
  }

  @ApiOperation({ summary: 'Send history for a campaign' })
  @Get(':id/runs')
  runs(@Param('id') id: string) {
    return this.campaignService.listRuns(id);
  }

  @ApiOperation({ summary: 'Create a campaign (draft, scheduled once, or recurring)' })
  @Post()
  create(@Body() dto: CreateCampaignDto, @Req() req: any) {
    return this.campaignService.createCampaign({ ...dto, createdById: req.user.id });
  }

  @ApiOperation({ summary: 'Update a campaign' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.campaignService.updateCampaign(id, dto);
  }

  @ApiOperation({ summary: 'Start sending a campaign now' })
  @Post(':id/send')
  sendNow(@Param('id') id: string) {
    return this.campaignService.sendNow(id);
  }

  @ApiOperation({ summary: 'Send a test copy to one address' })
  @Post(':id/test')
  sendTest(@Param('id') id: string, @Body() dto: TestSendDto) {
    return this.campaignService.sendTest(id, dto.email);
  }

  @ApiOperation({ summary: 'Pause a scheduled campaign' })
  @Patch(':id/pause')
  pause(@Param('id') id: string) {
    return this.campaignService.pauseCampaign(id);
  }

  @ApiOperation({ summary: 'Resume a paused campaign' })
  @Patch(':id/resume')
  resume(@Param('id') id: string) {
    return this.campaignService.resumeCampaign(id);
  }

  @ApiOperation({ summary: 'Cancel campaign' })
  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.campaignService.cancelCampaign(id);
  }
}

function unsubscribePage(title: string, message: string, form = ''): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} · MJN Healthcare</title></head>
<body style="margin:0;font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#f8fafc;color:#0f172a;">
<div style="max-width:440px;margin:12vh auto;padding:32px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;text-align:center;">
<p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#0F4C81;">MJN Healthcare</p>
<h1 style="margin:0 0 12px;font-size:22px;">${title}</h1>
<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475569;">${message}</p>${form}
</div></body></html>`;
}

/** Public — reached from the unsubscribe link in campaign emails. */
@ApiTags('campaigns')
@Controller('email')
export class EmailUnsubscribeController {
  constructor(private readonly campaignService: CampaignService) {}

  // GET only shows a confirmation, so link scanners in mail clients cannot unsubscribe people.
  @Get('unsubscribe')
  @Header('Content-Type', 'text/html; charset=utf-8')
  confirm(@Query('e') e: string, @Query('t') t: string, @Query('c') c?: string) {
    const email = this.campaignService.verifyUnsubscribeLink(e, t);
    if (!email) {
      return unsubscribePage('Link not valid', 'This unsubscribe link is invalid or incomplete. Please use the link from your email.');
    }
    const action = `unsubscribe?e=${encodeURIComponent(e)}&t=${encodeURIComponent(t)}&c=${encodeURIComponent(c ?? '')}`;
    return unsubscribePage(
      'Unsubscribe?',
      `Stop marketing emails to <strong>${email.replace(/</g, '&lt;')}</strong>? You will still receive receipts and updates about your own case.`,
      `<form method="post" action="${action}"><button type="submit" style="border:0;border-radius:12px;background:#0F4C81;color:#fff;padding:12px 24px;font-size:14px;font-weight:600;cursor:pointer;">Yes, unsubscribe me</button></form>`,
    );
  }

  @Post('unsubscribe')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async unsubscribe(@Query('e') e: string, @Query('t') t: string, @Query('c') c?: string) {
    const email = this.campaignService.verifyUnsubscribeLink(e, t);
    if (!email) {
      return unsubscribePage('Link not valid', 'This unsubscribe link is invalid or incomplete. Please use the link from your email.');
    }
    await this.campaignService.unsubscribe(email, c);
    return unsubscribePage('You are unsubscribed', 'You will no longer receive marketing emails from MJN Healthcare.');
  }
}
