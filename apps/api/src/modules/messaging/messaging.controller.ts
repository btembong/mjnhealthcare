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
  constructor(private readonly messagingService: MessagingService) {}

  @ApiOperation({ summary: 'Get messages for an engagement' })
  @Get('engagement/:engagementId')
  getMessages(@Param('engagementId') engagementId: string) {
    return this.messagingService.getMessages(engagementId);
  }

  @ApiOperation({ summary: 'Send a message in an engagement thread' })
  @Post('engagement/:engagementId')
  sendMessage(
    @Param('engagementId') engagementId: string,
    @Body() dto: SendMessageDto,
    @Req() req: any,
  ) {
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
  markRead(@Param('engagementId') engagementId: string, @Req() req: any) {
    return this.messagingService.markRead(engagementId, req.user.id);
  }

  @ApiOperation({ summary: 'Get unread message count for current user' })
  @Get('unread')
  getUnreadCount(@Req() req: any) {
    return this.messagingService.getUnreadCount(req.user.id);
  }
}
