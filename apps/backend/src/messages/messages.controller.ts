import { Controller, Post, Body, UseGuards, Req, Get, Param, Patch } from '@nestjs/common';
import { MessagesService } from './messages.service.js';
import { AuthGuard, WorkspaceGuard } from '../common/guards/index.js';
import type { AuthenticatedRequest } from '../common/guards/index.js';
import { QueueService, QueueName } from '../queues/queue.service.js';

@Controller('api/messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly queueService: QueueService,
  ) {}

  @Post('send')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async sendMessage(
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    const workspaceId = req.workspaceId as string;
    const message = await this.messagesService.sendTextMessage(workspaceId, body);
    
    return {
      message: 'Message sent successfully',
      data: message,
    };
  }

  @Get('conversations')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async getConversations(@Req() req: AuthenticatedRequest) {
    const workspaceId = req.workspaceId as string;
    const conversations = await this.messagesService.getConversations(workspaceId);
    
    return {
      message: 'Conversations retrieved successfully',
      data: conversations,
    };
  }

  @Get('history/:conversationId')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async getMessageHistory(
    @Req() req: AuthenticatedRequest,
    @Param('conversationId') conversationId: string,
  ) {
    const workspaceId = req.workspaceId as string;
    const messages = await this.messagesService.getMessageHistory(workspaceId, conversationId);
    
    return {
      message: 'Messages retrieved successfully',
      data: messages,
    };
  }

  @Post('campaigns/launch')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async launchCampaign(
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    const workspaceId = req.workspaceId as string;
    const campaignId = `camp_${Date.now()}`;
    
    await this.queueService.addJob(
      QueueName.CAMPAIGN,
      'execute-campaign',
      {
        campaignId,
        workspaceId,
        templateName: body.templateName,
        contactIds: body.contactIds,
        languageCode: body.languageCode || 'en',
      }
    );

    return {
      message: 'Campaign queued for high-throughput broadcast successfully',
      data: { campaignId },
    };
  }

  @Get('campaigns/stats')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async getCampaignStats(@Req() req: AuthenticatedRequest) {
    const workspaceId = req.workspaceId as string;
    const stats = await this.messagesService.getCampaignStats(workspaceId);
    
    return {
      message: 'Campaign statistics retrieved successfully',
      data: stats,
    };
  }

  @Post('conversations/:id/toggle-ai')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async toggleAi(
    @Req() req: AuthenticatedRequest,
    @Param('id') conversationId: string,
  ) {
    const workspaceId = req.workspaceId as string;
    const result = await this.messagesService.toggleAi(workspaceId, conversationId);
    return {
      message: result.isHumanTakeover ? 'AI auto-reply paused. Human takeover active.' : 'AI auto-reply resumed. Bot active.',
      data: result,
    };
  }

  @Post('conversations/:id/assign')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async assignConversation(
    @Req() req: AuthenticatedRequest,
    @Param('id') conversationId: string,
    @Body('staffId') staffId: string | null,
  ) {
    const workspaceId = req.workspaceId as string;
    const conv = await this.messagesService.assignConversation(workspaceId, conversationId, staffId);
    return {
      message: 'Conversation assignment updated',
      data: conv,
    };
  }

  @Patch('conversations/:id/status')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async updateStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') conversationId: string,
    @Body('status') status: string,
  ) {
    const workspaceId = req.workspaceId as string;
    const conv = await this.messagesService.updateConversationStatus(workspaceId, conversationId, status);
    return {
      message: 'Conversation status updated',
      data: conv,
    };
  }
}

