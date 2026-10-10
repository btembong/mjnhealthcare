import { CurrentUser, AuthUser } from '../auth/access';
import { AccessService } from '../auth/access.service';
import {
  Controller, Get, Post, Patch, Param, Body, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessagingService } from './messaging.service';
import { MessageSenderType } from '@mjn/database';

class SendMessageDto {
  @IsString()
  content: string;
}

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagingController {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly access: AccessService,
  ) {}

  @ApiOperation({ summary: 'Get messages for an engagement' })
  @Get('engagement/:engagementId')
  async getMessages(@CurrentUser() user: AuthUser, @Param('engagementId') engagementId: string) {
    await this.access.assertEngagement(user, engagementId);
    return this.messagingService.getMessages(engagementId);
  }

  @ApiOperation({ summary: 'Send a message in an engagement thread' })
  @Post('engagement/:engagementId')
  async sendMessage(@CurrentUser() user: AuthUser, 
    @Param('engagementId') engagementId: string,
    @Body() dto: SendMessageDto,
    @Req() req: any,
  ) {
    await this.access.assertEngagement(user, engagementId);
    const person = req.user;
    const senderType: MessageSenderType =
      person.role === 'CANDIDATE' || person.role === 'STUDENT'
        ? MessageSenderType.CLIENT
        : person.role === 'ADMIN'
          ? MessageSenderType.ADMIN
          : MessageSenderType.CONSULTANT;
    return this.messagingService.sendMessage(engagementId, person.id, senderType, dto.content);
  }

  @ApiOperation({ summary: 'Mark all messages in engagement as read' })
  @Patch('engagement/:engagementId/read')
  async markRead(@CurrentUser() user: AuthUser, @Param('engagementId') engagementId: string, @Req() req: any) {
    await this.access.assertEngagement(user, engagementId);
    return this.messagingService.markRead(engagementId, req.user.id);
  }

  @ApiOperation({ summary: 'Get unread message count for current user' })
  @Get('unread')
  getUnreadCount(@Req() req: any) {
    return this.messagingService.getUnreadCount(req.user.id);
  }
}
