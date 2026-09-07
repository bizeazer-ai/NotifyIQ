import { Controller, Get, Post, Query, Headers, Req, Res, HttpCode, HttpStatus, UnauthorizedException, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { env } from '@notifyiq/config';
import { verifyMetaSignature } from '../lib/utils/metaSignature.js';
import { QueueService, QueueName } from '../queues/queue.service.js';

interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
  body: any;
}

@Controller('api/waba/webhook')
export class WebhookController {
  constructor(private readonly queueService: QueueService) {}

  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.challenge') challenge: string,
    @Query('hub.verify_token') token: string,
    @Res() res: Response,
  ) {
    console.log('[WebhookController] Received Meta verification handshake request');

    const verifyToken = env.META_WEBHOOK_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('[WebhookController] Webhook verified successfully');
      return res.status(HttpStatus.OK).send(challenge);
    } else {
      console.error('[WebhookController] Webhook verification failed. Token mismatch.');
      return res.status(HttpStatus.FORBIDDEN).send('Verification token mismatch');
    }
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RequestWithRawBody,
    @Headers('x-hub-signature-256') signature: string,
  ) {
    const startTime = Date.now();
    console.log('[WebhookController] Received WABA event webhook notification');

    // Skip signature check in development if flag is set, but default to strict check
    const isMock = process.env.MOCK_SERVICES === 'true';
    if (!isMock) {
      if (!signature) {
        console.error('[WebhookController] Missing signature header');
        throw new UnauthorizedException('Missing signature header');
      }

      if (!req.rawBody) {
        console.error('[WebhookController] Missing raw body buffer');
        throw new BadRequestException('Raw request body is required for signature verification');
      }

      const isValid = verifyMetaSignature(req.rawBody, signature);
      if (!isValid) {
        console.error('[WebhookController] Invalid webhook signature');
        throw new UnauthorizedException('Invalid signature');
      }
    } else {
      console.log('[WebhookController] Running in mock/dev mode. Skipping webhook signature verification.');
    }

    // Delegate payload asynchronously to BullMQ
    try {
      await this.queueService.addJob(
        QueueName.WEBHOOK_PROCESSOR,
        'process-meta-event',
        req.body,
      );
    } catch (err) {
      console.error('[WebhookController] Failed to enqueue webhook job:', err);
    }

    const duration = Date.now() - startTime;
    console.log(`[WebhookController] Acknowledged webhook in ${duration}ms`);

    // Return instant 200 OK
    return { success: true };
  }
}
