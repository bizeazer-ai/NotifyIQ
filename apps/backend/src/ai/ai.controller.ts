import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { SuggestionsService } from './suggestions.service.js';
import { RagService } from './rag.service.js';
import { AuthGuard, WorkspaceGuard } from '../common/guards/index.js';
import type { AuthenticatedRequest } from '../common/guards/index.js';

@Controller('api/ai')
export class AiController {
  constructor(
    private readonly suggestionsService: SuggestionsService,
    private readonly ragService: RagService,
  ) { }

  @Get('suggestions/:conversationId')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async getSuggestions(
    @Req() req: AuthenticatedRequest,
    @Param('conversationId') conversationId: string,
  ) {
    const workspaceId = req.workspaceId as string;
    const suggestions = await this.suggestionsService.generateSuggestions(workspaceId, conversationId);
    return {
      message: 'AI suggested replies generated successfully',
      data: {
        suggestions,
      },
    };
  }

  @Post('knowledge')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async uploadKnowledge(
    @Req() req: AuthenticatedRequest,
    @Body('title') title: string,
    @Body('content') content: string,
  ) {
    const workspaceId = req.workspaceId as string;
    const doc = await this.ragService.uploadKnowledgeDoc(workspaceId, title, content);
    return {
      message: 'Knowledge document uploaded and indexed successfully for vector search',
      data: {
        id: (doc as any)._id,
        title: doc.title,
      },
    };
  }

  @Post('query')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async queryKnowledge(
    @Req() req: AuthenticatedRequest,
    @Body('query') query: string,
  ) {
    const workspaceId = req.workspaceId as string;
    const result = await this.ragService.queryKnowledgeBase(workspaceId, query);
    return {
      message: 'Knowledge base query response completed',
      data: result,
    };
  }

  @Get('knowledge')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async getKnowledgeBase(
    @Req() req: AuthenticatedRequest,
  ) {
    const workspaceId = req.workspaceId as string;
    const knowledgeBase = await this.ragService.getKnowledgeBase(workspaceId);
    return {
      message: 'Knowledge base retrieved successfully',
      data: knowledgeBase,
    }
  }
}