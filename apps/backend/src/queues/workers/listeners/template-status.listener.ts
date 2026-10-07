import { Injectable, Logger } from '@nestjs/common';
import { WorkspaceDocument } from '../../../database/schemas/workspace.schema.js';
import { OutboundWebhookDispatcher } from '../../../outbound-webhooks/outbound-webhook.dispatcher.js';

/**
 * TemplateStatusListener
 *
 * Handles WhatsApp `message_template_status_update` changes from the webhook.
 * Meta sends this when a template is approved, rejected, or paused.
 *
 * Dispatches outbound webhook: template.status_changed
 */
@Injectable()
export class TemplateStatusListener {
  private readonly logger = new Logger(TemplateStatusListener.name);

  constructor(private readonly dispatcher: OutboundWebhookDispatcher) {}

  /**
   * Handle template status change events.
   * Called by WebhookWorker when change.field === 'message_template_status_update'.
   */
  async handle(change: any, workspace: WorkspaceDocument): Promise<void> {
    if (change.field !== 'message_template_status_update') return;

    const val = change.value;
    if (!val) return;

    const workspaceId = workspace._id.toString();
    const event = val.event; // 'APPROVED' | 'REJECTED' | 'PAUSED' | 'FLAGGED' | 'RESTORED'

    this.logger.log(`[TemplateStatus] Template "${val.message_template_name}" → ${event} (workspace: ${workspaceId})`);

    this.dispatcher.dispatchEvent(workspaceId, 'template.status_changed', {
      templateId: val.message_template_id,
      templateName: val.message_template_name,
      language: val.message_template_language,
      status: event,
      reason: val.reason || null,
      disableInfo: val.disable_info || null,
    }).catch((err) => this.logger.error(`[TemplateStatus] Dispatcher error: ${err.message}`));
  }
}
