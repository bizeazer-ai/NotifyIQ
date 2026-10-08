import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard, WorkspaceGuard } from '../common/guards/index.js';
import type { AuthenticatedRequest } from '../common/guards/index.js';
import { ApiKeysService } from './api-keys.service.js';
import { CreateApiKeyDto } from './dto/create-api-key.dto.js';

@Controller('api/api-keys')
@UseGuards(AuthGuard, WorkspaceGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  async listKeys(@Req() req: AuthenticatedRequest) {
    const workspaceId = req.workspaceId as string;
    const keys = await this.apiKeysService.listApiKeys(workspaceId);
    return {
      message: 'API keys retrieved successfully',
      data: keys,
    };
  }

  @Post()
  async createKey(@Req() req: AuthenticatedRequest, @Body() dto: CreateApiKeyDto) {
    const workspaceId = req.workspaceId as string;
    const result = await this.apiKeysService.createApiKey(workspaceId, dto);
    return {
      message: 'API key generated successfully. Copy this secret key immediately as it will not be displayed again.',
      data: result,
    };
  }

  @Delete(':id')
  async revokeKey(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const workspaceId = req.workspaceId as string;
    const result = await this.apiKeysService.revokeApiKey(workspaceId, id);
    return result;
  }

  @Post(':id/rotate')
  async rotateKey(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const workspaceId = req.workspaceId as string;
    const result = await this.apiKeysService.rotateApiKey(workspaceId, id);
    return {
      message: 'API key rotated successfully. Please copy the new key now.',
      data: result,
    };
  }
}
