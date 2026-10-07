import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QueueService, QueueName, UnifiedWorker } from '../queue.service.js';
import { Workspace, WorkspaceDocument } from '../../database/schemas/workspace.schema.js';
import { InboundMessageListener } from './listeners/inbound-message.listener.js';
import { MessageStatusListener } from './listeners/message-status.listener.js';
import { TemplateStatusListener } from './listeners/template-status.listener.js';
import { AccountUpdateListener } from './listeners/account-update.listener.js';

/**
 * WebhookWorker
 *
 * Thin orchestrator worker for the WEBHOOK_PROCESSOR queue.
 * Parses incoming raw Meta Cloud API webhook payloads and delegates
 * processing to dedicated modular listeners:
 *
 *   1. InboundMessageListener  → val.messages
 *   2. MessageStatusListener   → val.statuses
 *   3. TemplateStatusListener  → change.field === 'message_template_status_update'
 *   4. AccountUpdateListener   → change.field === 'account_update'
 */
@Injectable()
export class WebhookWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WebhookWorker.name);
  private worker: UnifiedWorker;

  constructor(
    private readonly queueService: QueueService,
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<WorkspaceDocument>,
    private readonly inboundMessageListener: InboundMessageListener,
    private readonly messageStatusListener: MessageStatusListener,
    private readonly templateStatusListener: TemplateStatusListener,
    private readonly accountUpdateListener: AccountUpdateListener,
  ) {}

  onModuleInit() {
    this.worker = this.queueService.createWorker(
      QueueName.WEBHOOK_PROCESSOR,
      async (job: any) => {
        const payload = job.data;
        this.logger.log(`[WebhookWorker] Processing raw webhook event: ${job.id}`);

        const entries = payload?.entry || [];
        for (const entry of entries) {
          const changes = entry.changes || [];
          for (const change of changes) {
            const val = change.value;
            if (!val || val.messaging_product !== 'whatsapp') continue;

            const metadata = val.metadata;
            if (!metadata) continue;

            const phoneNumberId = metadata.phone_number_id;

            const workspace = await this.workspaceModel.findOne({ 'waba.phoneNumberId': phoneNumberId });
            if (!workspace) {
              this.logger.warn(`[WebhookWorker] Unknown WABA phone number ID: ${phoneNumberId}`);
              continue;
            }

            // 1. Inbound messages (text, media, interactive)
            if (val.messages && val.messages.length > 0) {
              await this.inboundMessageListener.handle(val, workspace);
            }

            // 2. Message status updates (sent, delivered, read, failed)
            if (val.statuses && val.statuses.length > 0) {
              await this.messageStatusListener.handle(val, workspace);
            }

            // 3. Message template status updates (APPROVED, REJECTED, PAUSED, etc.)
            if (change.field === 'message_template_status_update') {
              await this.templateStatusListener.handle(change, workspace);
            }

            // 4. WABA account health & quality updates
            if (change.field === 'account_update') {
              await this.accountUpdateListener.handle(change, workspace);
            }
          }
        }

        return { success: true };
      },
      { concurrency: 20 },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`[WebhookWorker] Raw payload processing completed for job: ${job.id}`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`[WebhookWorker] Processing failed for job ${job?.id}: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
      this.logger.log('[WebhookWorker] Closed connection');
    }
  }

  /**
   * Helper delegate method for backwards compatibility with tests and callers
   */
  async evaluateAndExecuteAutoReply(
    workspace: WorkspaceDocument,
    conversation: any,
    contact: any,
    userQuery: string,
  ): Promise<void> {
    return this.inboundMessageListener.runAutoReply(
      workspace,
      conversation,
      contact,
      userQuery,
    );
  }
}
