import {
  Controller, Get, Post, Patch, Put, Delete, Param, Body, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SurveyService, QuestionInput } from './survey.service';

class CreateSurveyDto {
  @IsString() @MaxLength(200) title: string;
}

class SaveQuestionsDto {
  @IsArray() questions: QuestionInput[];
}

class ExportDto {
  @IsString() @MaxLength(10) format: string;
}

class SubmitSurveyDto {
  @IsObject() answers: Record<string, unknown>;
  @IsString() @IsOptional() @MaxLength(200) name?: string;
  @IsString() @IsOptional() @MaxLength(200) email?: string;
  @IsString() @IsOptional() locale?: string;
  @IsBoolean() @IsOptional() consent?: boolean;
  @IsString() @IsOptional() website?: string;
}

@ApiTags('surveys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('surveys')
export class SurveyController {
  constructor(private readonly surveys: SurveyService) {}

  @ApiOperation({ summary: 'List surveys' })
  @Get()
  list() {
    return this.surveys.list();
  }

  @ApiOperation({ summary: 'Create a draft survey' })
  @Post()
  create(@Body() dto: CreateSurveyDto, @Req() req: any) {
    return this.surveys.create({ title: dto.title, createdById: req.user.id });
  }

  @ApiOperation({ summary: 'Get a survey with its questions' })
  @Get(':id')
  get(@Param('id') id: string) {
    return this.surveys.get(id);
  }

  // The settings body is validated field by field in the service.
  @ApiOperation({ summary: 'Update survey settings or status' })
  @Patch(':id')
  update(@Param('id') id: string, @Req() req: any) {
    return this.surveys.update(id, req.body ?? {}, req.user.id);
  }

  @ApiOperation({ summary: 'Replace the question set' })
  @Put(':id/questions')
  saveQuestions(@Param('id') id: string, @Body() dto: SaveQuestionsDto, @Req() req: any) {
    return this.surveys.saveQuestions(id, dto.questions, req.user.id);
  }

  @ApiOperation({ summary: 'Aggregated results and individual responses' })
  @Get(':id/results')
  results(@Param('id') id: string) {
    return this.surveys.results(id);
  }

  @ApiOperation({ summary: 'Delete a survey and its responses' })
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.surveys.remove(id, req.user.id);
  }

  @ApiOperation({ summary: 'Copy a survey into a new draft' })
  @Post(':id/duplicate')
  duplicate(@Param('id') id: string, @Req() req: any) {
    return this.surveys.duplicate(id, req.user.id);
  }

  @ApiOperation({ summary: 'Erase a single response' })
  @Delete(':id/responses/:responseId')
  removeResponse(@Param('id') id: string, @Param('responseId') responseId: string, @Req() req: any) {
    return this.surveys.removeResponse(id, responseId, req.user.id);
  }

  @ApiOperation({ summary: 'Record that results were exported' })
  @Post(':id/exports')
  logExport(@Param('id') id: string, @Body() dto: ExportDto, @Req() req: any) {
    return this.surveys.logExport(id, req.user.id, dto.format);
  }
}

/** Unauthenticated — the survey page on the public website. */
@ApiTags('surveys')
@Controller('public/surveys')
export class PublicSurveyController {
  constructor(private readonly surveys: SurveyService) {}

  @Get(':slug')
  get(@Param('slug') slug: string) {
    return this.surveys.getPublic(slug);
  }

  @Post(':slug/responses')
  submit(@Param('slug') slug: string, @Body() dto: SubmitSurveyDto, @Req() req: any) {
    const forwarded = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim();
    return this.surveys.submit(slug, dto, forwarded || req.ip || 'unknown');
  }
}

/** Any logged-in client — surveys they are invited to from the portal. */
@ApiTags('surveys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('portal/surveys')
export class PortalSurveyController {
  constructor(private readonly surveys: SurveyService) {}

  @Get()
  active(@Req() req: any) {
    return this.surveys.activeForPortal(req.user?.email);
  }
}
