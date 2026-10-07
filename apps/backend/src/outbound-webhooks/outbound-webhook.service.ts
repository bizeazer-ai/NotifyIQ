import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import crypto from 'crypto';
import {
  OutboundWebhook,
  OutboundWebhookDocument,
  VALID_EVENT_TYPES,
} from '../database/schemas/outbound-webhook.schema.js';
import { OutboundWebhookDispatcher } from './outbound-webhook.dispatcher.js';
import { RegisterWebhookDto, UpdateWebhookDto } from './dto/webhook.dto.js';
import { encrypt, decrypt } from '../lib/utils/encryption.js';

@Injectable()
export class OutboundWebhooksService {
  constructor(
    @InjectModel(OutboundWebhook.name)
    private readonly webhookModel: Model<OutboundWebhookDocument>,
    private readonly dispatcher: OutboundWebhookDispatcher,
  ) {}

  /**
   * Register a new outbound webhook endpoint for a workspace.
   * Generates + encrypts a fresh HMAC secret automatically.
   */
  async register(workspaceId: string, dto: RegisterWebhookDto) {
    const events = dto.events?.length ? dto.events : ['*'];
    this.validateEventTypes(events);

    const plainSecret = crypto.randomBytes(32).toString('hex'); // 64-char hex
    const encryptedSecret = encrypt(plainSecret);

    const endpoint = await this.webhookModel.create({
      workspaceId,
      description: dto.description,
      url: dto.url,
      secret: encryptedSecret,
      events,
      isActive: true,
      failureCount: 0,
      lastDelivery: null,
    });

    // Return with plaintext secret — shown ONCE to the user
    return {
      ...this.sanitize(endpoint),
      secret: plainSecret, // Only time the plain secret is returned
    };
  }

  /** List all registered endpoints for a workspace (secrets masked) */
  async list(workspaceId: string) {
    const endpoints = await this.webhookModel
      .find({ workspaceId })
      .sort({ createdAt: -1 });
    return endpoints.map(this.sanitize);
  }

  /** Get a single endpoint (secrets masked) */
  async getOne(id: string, workspaceId: string) {
    const endpoint = await this.findAndVerifyOwnership(id, workspaceId);
    return this.sanitize(endpoint);
  }

  /** Update endpoint URL, events, description, or active status */
  async update(id: string, workspaceId: string, dto: UpdateWebhookDto) {
    const endpoint = await this.findAndVerifyOwnership(id, workspaceId);

    if (dto.events) this.validateEventTypes(dto.events);

    Object.assign(endpoint, {
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.url !== undefined && { url: dto.url }),
      ...(dto.events !== undefined && { events: dto.events }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });

    // Reset failure count when re-enabling
    if (dto.isActive === true) endpoint.failureCount = 0;

    await endpoint.save();
    return this.sanitize(endpoint);
  }

  /** Permanently remove an endpoint */
  async remove(id: string, workspaceId: string) {
    await this.findAndVerifyOwnership(id, workspaceId);
    await this.webhookModel.findByIdAndDelete(id);
  }

  /**
   * Rotate the HMAC secret for an endpoint.
   * Returns the new plaintext secret — shown once.
   */
  async rotateSecret(id: string, workspaceId: string) {
    const endpoint = await this.findAndVerifyOwnership(id, workspaceId);

    const plainSecret = crypto.randomBytes(32).toString('hex');
    endpoint.secret = encrypt(plainSecret);
    await endpoint.save();

    return {
      id: endpoint._id.toString(),
      secret: plainSecret,
    };
  }

  /**
   * Send a test ping to the endpoint to verify connectivity.
   * Uses the dispatcher to sign + deliver a real payload.
   */
  async testDelivery(id: string, workspaceId: string) {
    const endpoint = await this.findAndVerifyOwnership(id, workspaceId);

    if (!endpoint.isActive) {
      throw new BadRequestException('Endpoint is disabled. Enable it before testing.');
    }

    await this.dispatcher.dispatchEvent(workspaceId, 'message.inbound', {
      _test: true,
      message: {
        id: `test_${Date.now()}`,
        type: 'text',
        body: 'This is a test payload from NotifyIQ webhook system.',
        direction: 'inbound',
        status: 'delivered',
        createdAt: new Date().toISOString(),
      },
      contact: {
        id: 'test_contact',
        phone: '+910000000000',
        name: 'Test Contact',
      },
      conversation: {
        id: 'test_conversation',
        sentiment: 'neutral',
      },
    });

    return { message: 'Test payload dispatched. Check your endpoint for the test delivery.' };
  }

  // ─────────────── Helpers ───────────────

  private async findAndVerifyOwnership(id: string, workspaceId: string): Promise<OutboundWebhookDocument> {
    const endpoint = await this.webhookModel.findById(id);
    if (!endpoint) throw new NotFoundException('Webhook endpoint not found');
    if (endpoint.workspaceId.toString() !== workspaceId) {
      throw new ForbiddenException('Access denied to this webhook endpoint');
    }
    return endpoint;
  }

  private validateEventTypes(events: string[]) {
    const invalid = events.filter((e) => !(VALID_EVENT_TYPES as readonly string[]).includes(e));
    if (invalid.length > 0) {
      throw new BadRequestException(`Invalid event type(s): ${invalid.join(', ')}. Supported: ${VALID_EVENT_TYPES.join(', ')}`);
    }
  }

  /** Strip encrypted secret from output */
  private sanitize(endpoint: OutboundWebhookDocument) {
    return {
      id: endpoint._id.toString(),
      workspaceId: endpoint.workspaceId.toString(),
      description: endpoint.description,
      url: endpoint.url,
      events: endpoint.events,
      isActive: endpoint.isActive,
      failureCount: endpoint.failureCount,
      lastDelivery: endpoint.lastDelivery,
      createdAt: (endpoint as any).createdAt,
      updatedAt: (endpoint as any).updatedAt,
    };
  }
}
