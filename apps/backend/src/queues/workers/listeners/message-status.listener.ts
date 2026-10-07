import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WorkspaceDocument } from '../../../database/schemas/workspace.schema.js';
import { Message, MessageDocument } from '../../../database/schemas/message.schema.js';
import { Contact, ContactDocument } from '../../../database/schemas/contact.schema.js';
import { SocketGateway } from '../../../socket/socket.gateway.js';
import { OutboundWebhookDispatcher } from '../../../outbound-webhooks/outbound-webhook.dispatcher.js';

/**
 * MessageStatusListener
 *
 * Handles the `statuses` array from a WhatsApp webhook change.value payload.
 * Responsible for:
 *   1. Update Message.status in MongoDB
 *   2. Emit real-time socket event (message.status_updated)
 *   3. Dispatch outbound webhook: message.status
 */
@Injectable()
export class MessageStatusListener {
  private readonly logger = new Logger(MessageStatusListener.name);

  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Contact.name) private readonly contactModel: Model<ContactDocument>,
    private readonly socketGateway: SocketGateway,
    private readonly dispatcher: OutboundWebhookDispatcher,
  ) {}

  /**
   * Handle the statuses array from a WhatsApp webhook change value.
   * Called by WebhookWorker for each workspace-matched change.
   */
  async handle(val: any, workspace: WorkspaceDocument): Promise<void> {
    if (!val.statuses || val.statuses.length === 0) return;

    const workspaceId = workspace._id.toString();

    for (const status of val.statuses) {
      await this.processStatus(status, workspaceId);
    }
  }

  private async processStatus(status: any, workspaceId: string): Promise<void> {
    const messageRecord = await this.messageModel.findOne({ waMessageId: status.id });
    if (!messageRecord) return;

    const previousStatus = messageRecord.status;
    messageRecord.status = status.status;
    await messageRecord.save();

    // ── 1. Real-time socket emit ─────────────────────────────────────
    this.socketGateway.emitToWorkspace(workspaceId, 'message.status_updated', {
      messageId: messageRecord._id.toString(),
      waMessageId: status.id,
      status: status.status,
      previousStatus,
    });

    // ── 2. Resolve contact for enriched payload ──────────────────────
    let contact: ContactDocument | null = null;
    try {
      if (status.recipient_id) {
        const phone = status.recipient_id.startsWith('+') ? status.recipient_id : `+${status.recipient_id}`;
        contact = await this.contactModel.findOne({ workspaceId, phone });
      }
    } catch (_) {
      // Non-critical — proceed without contact enrichment
    }

    // ── 3. Dispatch outbound webhook: message.status ─────────────────
    this.dispatcher.dispatchEvent(workspaceId, 'message.status', {
      waMessageId: status.id,
      messageId: messageRecord._id.toString(),
      status: status.status,
      previousStatus,
      timestamp: status.timestamp ? new Date(Number(status.timestamp) * 1000).toISOString() : new Date().toISOString(),
      ...(contact && {
        contact: {
          id: contact._id.toString(),
          phone: contact.phone,
          name: contact.name,
        },
      }),
    }).catch((err) => this.logger.error(`[MessageStatus] Dispatcher error: ${err.message}`));
  }
}
