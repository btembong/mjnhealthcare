import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AIService } from './ai.service';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  // ── Study Assistant ───────────────────────────────────────────────────────

  @Post('study-chat')
  studyChat(
    @Body() body: {
      personId: string;
      messages: { role: 'user' | 'assistant'; content: string }[];
      locale: 'en' | 'fr';
    },
  ) {
    return this.aiService.studyAssistantChat(body.personId, body.messages, body.locale);
  }

  @Get('study-conversation/:personId')
  getStudyConversation(@Param('personId') personId: string) {
    return this.aiService.getConversation(personId, 'study_assistant');
  }

  @Delete('study-conversation/:personId')
  clearStudyConversation(@Param('personId') personId: string) {
    return this.aiService.clearConversation(personId, 'study_assistant');
  }

  // ── Case Status Bot (portal) ──────────────────────────────────────────────

  @Post('case-chat/:engagementId')
  caseChat(
    @Param('engagementId') engagementId: string,
    @Body() body: {
      personId: string;
      messages: { role: 'user' | 'assistant'; content: string }[];
    },
  ) {
    return this.aiService.caseChatMessage(body.personId, engagementId, body.messages);
  }

  @Get('case-conversation/:personId')
  getCaseConversation(@Param('personId') personId: string) {
    return this.aiService.getConversation(personId, 'case_bot');
  }

  @Delete('case-conversation/:personId')
  clearCaseConversation(@Param('personId') personId: string) {
    return this.aiService.clearConversation(personId, 'case_bot');
  }

  // ── AI Drafts ─────────────────────────────────────────────────────────────

  @Post('draft-update/:engagementId')
  draftUpdate(
    @Param('engagementId') engagementId: string,
    @Body() body: { context?: string },
  ) {
    return this.aiService.draftClientUpdate(engagementId, body.context);
  }

  @Patch('drafts/:id/approve')
  approveDraft(@Param('id') id: string, @Body() body: { reviewedBy: string }) {
    return this.aiService.approveDraft(id, body.reviewedBy);
  }

  @Get('drafts/pending')
  getPendingDrafts() {
    return this.aiService.getPendingDrafts();
  }

  // ── Case Summary ──────────────────────────────────────────────────────────

  @Post('case-summary/:engagementId')
  summariseCase(@Param('engagementId') engagementId: string) {
    return this.aiService.summariseCase(engagementId);
  }

  // ── Document Pre-screening ────────────────────────────────────────────────

  @Post('prescreen-document/:documentId')
  prescreenDocument(@Param('documentId') documentId: string) {
    return this.aiService.prescreenDocument(documentId);
  }
}

// Public support bot — no auth required
import { Controller as PublicController } from '@nestjs/common';

@ApiTags('support')
@PublicController('support')
export class SupportController {
  constructor(private readonly aiService: AIService) {}

  @Post('chat')
  supportChat(
    @Body() body: {
      messages: { role: 'user' | 'assistant'; content: string }[];
      lead?: { name?: string; email?: string; profession?: string; destination?: string };
    },
  ) {
    return this.aiService.supportChat(body.messages, body.lead);
  }
}
