import { CurrentUser, AuthUser, StaffOnly, isAdmin, isStaff } from '../auth/access';
import { AccessService } from '../auth/access.service';
import {
  Controller, Get, Post, Patch, Param, Body, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ComplianceService } from '../compliance/compliance.service';
import { MessagingService } from './messaging.service';
import { MessageSenderType } from '@mjn/database';

class AttachmentDto {
  @IsString()
  key: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  type?: string;
}

class SendMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AttachmentDto)
  attachment?: AttachmentDto;
}

class AttachmentUploadDto {
  @IsString()
  fileName: string;
}

class SaveAttachmentDto {
  @IsString()
  documentType: string;
}

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagingController {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly access: AccessService,
    private readonly compliance: ComplianceService,
  ) {}

  // Declared before the ':messageId' routes so 'conversations' is not read as a message id.
  @ApiOperation({ summary: 'Staff inbox: each case with its last message and whether the client is waiting' })
  @StaffOnly()
  @Get('conversations')
  async getConversations(@CurrentUser() user: AuthUser) {
    const scope = await this.access.consultantScope(user);
    return this.messagingService.getConversations(scope ? scope.canSeeEngagement : null);
  }

  @ApiOperation({ summary: 'Get messages for an engagement' })
  @Get('engagement/:engagementId')
  async getMessages(@CurrentUser() user: AuthUser, @Param('engagementId') engagementId: string) {
    await this.access.assertEngagement(user, engagementId);
    return this.messagingService.getMessages(engagementId);
  }

  @ApiOperation({ summary: 'Get a short-lived link to upload a file for this conversation' })
  @Post('engagement/:engagementId/attachment-url')
  async getAttachmentUploadUrl(
    @CurrentUser() user: AuthUser,
    @Param('engagementId') engagementId: string,
    @Body() dto: AttachmentUploadDto,
  ) {
    await this.access.assertEngagement(user, engagementId);
    return this.messagingService.getAttachmentUploadUrl(engagementId, dto.fileName);
  }

  @ApiOperation({ summary: 'Send a message in an engagement thread' })
  @Post('engagement/:engagementId')
  async sendMessage(@CurrentUser() user: AuthUser,
    @Param('engagementId') engagementId: string,
    @Body() dto: SendMessageDto,
  ) {
    await this.access.assertEngagement(user, engagementId);
    // Anyone who is not staff is writing as the client.
    const senderType: MessageSenderType = !isStaff(user)
      ? MessageSenderType.CLIENT
      : isAdmin(user)
        ? MessageSenderType.ADMIN
        : MessageSenderType.CONSULTANT;
    return this.messagingService.sendMessage(engagementId, user.id, senderType, dto.content ?? '', dto.attachment);
  }

  @ApiOperation({ summary: 'Mark all messages in engagement as read' })
  @Patch('engagement/:engagementId/read')
  async markRead(@CurrentUser() user: AuthUser, @Param('engagementId') engagementId: string) {
    await this.access.assertEngagement(user, engagementId);
    return this.messagingService.markRead(engagementId, isStaff(user));
  }

  @ApiOperation({ summary: 'Get unread message count for current user' })
  @Get('unread')
  getUnreadCount(@Req() req: any) {
    return this.messagingService.getUnreadCount(req.user.id);
  }

  @ApiOperation({ summary: "Get a short-lived link to open a message's file" })
  @Get(':messageId/attachment-url')
  async getAttachmentViewUrl(@CurrentUser() user: AuthUser, @Param('messageId') messageId: string) {
    await this.access.assertEngagement(user, await this.messagingService.messageEngagementId(messageId));
    await this.compliance.logAuditEvent({
      actorId: user.id,
      action: 'message_attachment_viewed',
      resourceType: 'message',
      resourceId: messageId,
    });
    return this.messagingService.getAttachmentViewUrl(messageId);
  }

  @ApiOperation({ summary: "Staff: file a chat attachment into the client's documents" })
  @StaffOnly()
  @Post(':messageId/save-to-documents')
  async saveToDocuments(@CurrentUser() user: AuthUser, @Param('messageId') messageId: string, @Body() dto: SaveAttachmentDto) {
    await this.access.assertEngagement(user, await this.messagingService.messageEngagementId(messageId));
    const result = await this.messagingService.saveAttachmentAsDocument(messageId, dto.documentType, user.id);
    await this.compliance.logAuditEvent({
      actorId: user.id,
      action: 'message_attachment_saved_as_document',
      resourceType: 'document',
      resourceId: result.documentId,
      metadata: { messageId, documentType: dto.documentType },
    });
    return result;
  }
}
