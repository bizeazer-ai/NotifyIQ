import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import crypto from 'crypto';
import { OutboundWebhook, OutboundWebhookDocument, OutboundWebhookEventType } from '../database/schemas/outbound-webhook.schema.js';
import { decrypt } from '../lib/utils/encryption.js';

export interface WebhookEventEnvelope {
  event: OutboundWebhookEventType;
  workspaceId: string;
  timestamp: string;
  version: '1';
  data: Record<string, any>;
}

const MAX_FAILURES_BEFORE_DISABLE = 50;
const DELIVERY_TIMEOUT_MS = 10_000;

@Injectable()
export class OutboundWebhookDispatcher {
  private readonly logger = new Logger(OutboundWebhookDispatcher.name);

  constructor(
    @InjectModel(OutboundWebhook.name)
    private readonly webhookModel: Model<OutboundWebhookDocument>,
  ) {}

  /**
   * Dispatches a typed, enriched event to all active registered endpoints for a workspace.
   * Each payload is HMAC-signed and delivered with a 10s timeout.
   * Endpoints with 50+ consecutive failures are auto-disabled.
   */
  async dispatchEvent(
    workspaceId: string,
    event: OutboundWebhookEventType,
    data: Record<string, any>,
  ): Promise<void> {
    // Find all active endpoints for this workspace subscribed to this event or '*'
    const endpoints = await this.webhookModel.find({
      workspaceId,
      isActive: true,
      $or: [{ events: '*' }, { events: event }],
    });

    if (!endpoints || endpoints.length === 0) return;

    const envelope: WebhookEventEnvelope = {
      event,
      workspaceId,
      timestamp: new Date().toISOString(),
      version: '1',
      data,
    };

    const rawBody = JSON.stringify(envelope);

    // Dispatch concurrently — do NOT await individual deliveries inside the critical path
    await Promise.allSettled(
      endpoints.map((endpoint) => this.deliverToEndpoint(endpoint, rawBody)),
    );
  }

  private async deliverToEndpoint(
    endpoint: OutboundWebhookDocument,
    rawBody: string,
  ): Promise<void> {
    let secret: string;
    try {
      secret = decrypt(endpoint.secret);
    } catch (err: any) {
      this.logger.error(`[Dispatcher] Failed to decrypt secret for endpoint ${endpoint._id}: ${err.message}`);
      return;
    }

    const signature = 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);

    let statusCode: number | null = null;
    let deliveryError: string | null = null;
    let success = false;

    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-NotifyIQ-Signature-256': signature,
          'X-NotifyIQ-Event': JSON.parse(rawBody).event,
          'User-Agent': 'NotifyIQ-Webhooks/1.0',
        },
        body: rawBody,
        signal: controller.signal,
      });

      statusCode = response.status;
      success = response.ok; // 2xx
      if (!success) {
        deliveryError = `HTTP ${statusCode}`;
      }
    } catch (err: any) {
      deliveryError = err.name === 'AbortError' ? 'Timeout after 10s' : err.message;
    } finally {
      clearTimeout(timeoutHandle);
    }

    // Persist delivery result and manage failure counter
    const failureCount = success ? 0 : (endpoint.failureCount || 0) + 1;
    const shouldDisable = failureCount >= MAX_FAILURES_BEFORE_DISABLE;

    try {
      await this.webhookModel.findByIdAndUpdate(endpoint._id, {
        failureCount,
        isActive: shouldDisable ? false : endpoint.isActive,
        lastDelivery: {
          status: success ? 'success' : 'failed',
          statusCode,
          at: new Date(),
          error: deliveryError,
        },
      });

      if (success) {
        this.logger.debug(`[Dispatcher] Delivered ${JSON.parse(rawBody).event} to ${endpoint.url} → ${statusCode}`);
      } else {
        this.logger.warn(
          `[Dispatcher] Failed to deliver to ${endpoint.url}: ${deliveryError} (failures: ${failureCount}${shouldDisable ? ', auto-disabled' : ''})`,
        );
      }
    } catch (dbErr: any) {
      this.logger.error(`[Dispatcher] Failed to update delivery status for endpoint ${endpoint._id}: ${dbErr.message}`);
    }
  }
}
