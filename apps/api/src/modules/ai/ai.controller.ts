import { StaffOnly, CurrentUser, AuthUser } from '../auth/access';
import { AccessService } from '../auth/access.service';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AIService } from './ai.service';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AIController {
  constructor(
    private readonly aiService: AIService,
    private readonly access: AccessService,
  ) {}

  // ── Study Assistant ───────────────────────────────────────────────────────

  @Post('study-chat')
  async studyChat(@CurrentUser() user: AuthUser, 
    @Body() body: {
      personId: string;
      messages: { role: 'user' | 'assistant'; content: string }[];
      locale: 'en' | 'fr';
    },
  ) {
    await this.access.assertPerson(user, body.personId);
    return this.aiService.studyAssistantChat(body.personId, body.messages, body.locale);
  }

  @Get('study-conversation/:personId')
  async getStudyConversation(@CurrentUser() user: AuthUser, @Param('personId') personId: string) {
    await this.access.assertPerson(user, personId);
    return this.aiService.getConversation(personId, 'study_assistant');
  }

  @Delete('study-conversation/:personId')
  async clearStudyConversation(@CurrentUser() user: AuthUser, @Param('personId') personId: string) {
    await this.access.assertPerson(user, personId);
    return this.aiService.clearConversation(personId, 'study_assistant');
  }

  // ── Case Status Bot (portal) ──────────────────────────────────────────────

  @Post('case-chat/:engagementId')
  async caseChat(@CurrentUser() user: AuthUser, 
    @Param('engagementId') engagementId: string,
    @Body() body: {
      personId: string;
      messages: { role: 'user' | 'assistant'; content: string }[];
    },
  ) {
    await Promise.all([this.access.assertPerson(user, body.personId), this.access.assertEngagement(user, engagementId)]);
    return this.aiService.caseChatMessage(body.personId, engagementId, body.messages);
  }

  @Get('case-conversation/:personId')
  async getCaseConversation(@CurrentUser() user: AuthUser, @Param('personId') personId: string) {
    await this.access.assertPerson(user, personId);
    return this.aiService.getConversation(personId, 'case_bot');
  }

  @Delete('case-conversation/:personId')
  async clearCaseConversation(@CurrentUser() user: AuthUser, @Param('personId') personId: string) {
    await this.access.assertPerson(user, personId);
    return this.aiService.clearConversation(personId, 'case_bot');
  }

  // ── AI Drafts ─────────────────────────────────────────────────────────────

  @StaffOnly()
  @Post('draft-update/:engagementId')
  async draftUpdate(@CurrentUser() user: AuthUser, 
    @Param('engagementId') engagementId: string,
    @Body() body: { context?: string },
  ) {
    await this.access.assertEngagement(user, engagementId);
    return this.aiService.draftClientUpdate(engagementId, body.context);
  }

  @StaffOnly()
  @Patch('drafts/:id/approve')
  approveDraft(@Param('id') id: string, @Body() body: { reviewedBy: string }) {
    return this.aiService.approveDraft(id, body.reviewedBy);
  }

  @StaffOnly()
  @Get('drafts/pending')
  async getPendingDrafts(@CurrentUser() user: AuthUser) {
    const drafts = await this.aiService.getPendingDrafts();
    const scope = await this.access.consultantScope(user);
    return scope ? drafts.filter((d: any) => scope.canSeeEngagementId(d.engagementId)) : drafts;
  }

  // ── Case Summary ──────────────────────────────────────────────────────────

  @StaffOnly()
  @Post('case-summary/:engagementId')
  async summariseCase(@CurrentUser() user: AuthUser, @Param('engagementId') engagementId: string) {
    await this.access.assertEngagement(user, engagementId);
    return this.aiService.summariseCase(engagementId);
  }

  // ── Document Pre-screening ────────────────────────────────────────────────

  @StaffOnly()
  @Post('prescreen-document/:documentId')
  async prescreenDocument(@CurrentUser() user: AuthUser, @Param('documentId') documentId: string) {
    await this.access.assertDocument(user, documentId);
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
