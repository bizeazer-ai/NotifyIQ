import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OutboundWebhooksService } from './outbound-webhook.service.js';
import { RegisterWebhookDto, UpdateWebhookDto, SUPPORTED_EVENTS } from './dto/webhook.dto.js';
import { AuthGuard, WorkspaceGuard } from '../common/guards/index.js';
import type { AuthenticatedRequest } from '../common/guards/index.js';

@Controller('api/webhooks')
@UseGuards(AuthGuard, WorkspaceGuard)
export class OutboundWebhooksController {
  constructor(private readonly service: OutboundWebhooksService) {}

  /**
   * GET /api/webhooks/events
   * Returns all supported event types that can be subscribed to.
   */
  @Get('events')
  getSupportedEvents() {
    return {
      message: 'Supported webhook event types',
      data: SUPPORTED_EVENTS,
    };
  }

  /**
   * GET /api/webhooks
   * List all registered webhook endpoints for the workspace.
   */
  @Get()
  async list(@Req() req: AuthenticatedRequest) {
    const workspaceId = req.workspaceId as string;
    const endpoints = await this.service.list(workspaceId);
    return {
      message: 'Webhook endpoints retrieved successfully',
      data: endpoints,
    };
  }

  /**
   * GET /api/webhooks/:id
   * Get a specific webhook endpoint.
   */
  @Get(':id')
  async getOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const workspaceId = req.workspaceId as string;
    const endpoint = await this.service.getOne(id, workspaceId);
    return {
      message: 'Webhook endpoint retrieved successfully',
      data: endpoint,
    };
  }

  /**
   * POST /api/webhooks
   * Register a new webhook endpoint.
   * Returns the plaintext HMAC secret ONE TIME — store it securely.
   */
  @Post()
  async register(@Req() req: AuthenticatedRequest, @Body() dto: RegisterWebhookDto) {
    const workspaceId = req.workspaceId as string;
    const endpoint = await this.service.register(workspaceId, dto);
    return {
      message: 'Webhook endpoint registered successfully. Store the secret securely — it will not be shown again.',
      data: endpoint,
    };
  }

  /**
   * PATCH /api/webhooks/:id
   * Update URL, events, description, or active status.
   */
  @Patch(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    const workspaceId = req.workspaceId as string;
    const endpoint = await this.service.update(id, workspaceId, dto);
    return {
      message: 'Webhook endpoint updated successfully',
      data: endpoint,
    };
  }

  /**
   * DELETE /api/webhooks/:id
   * Permanently remove a webhook endpoint.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const workspaceId = req.workspaceId as string;
    await this.service.remove(id, workspaceId);
    return { message: 'Webhook endpoint removed successfully' };
  }

  /**
   * POST /api/webhooks/:id/rotate-secret
   * Generate and rotate the HMAC signing secret.
   * Returns the new plaintext secret ONE TIME.
   */
  @Post(':id/rotate-secret')
  async rotateSecret(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const workspaceId = req.workspaceId as string;
    const result = await this.service.rotateSecret(id, workspaceId);
    return {
      message: 'Webhook secret rotated successfully. Store the new secret — it will not be shown again.',
      data: result,
    };
  }

  /**
   * POST /api/webhooks/:id/test
   * Send a test message.inbound payload to verify endpoint connectivity.
   */
  @Post(':id/test')
  async test(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const workspaceId = req.workspaceId as string;
    const result = await this.service.testDelivery(id, workspaceId);
    return result;
  }
}
