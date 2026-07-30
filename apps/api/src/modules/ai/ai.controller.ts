import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AIService } from './ai.service';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

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

  @Post('draft-update/:engagementId')
  draftUpdate(@Param('engagementId') engagementId: string, @Body() body: { context: string }) {
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
