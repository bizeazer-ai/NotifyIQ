import { Injectable, Logger } from '@nestjs/common';
import { WorkspaceDocument } from '../../../database/schemas/workspace.schema.js';
import { OutboundWebhookDispatcher } from '../../../outbound-webhooks/outbound-webhook.dispatcher.js';

/**
 * AccountUpdateListener
 *
 * Handles WhatsApp `account_update` changes from the webhook.
 * Meta sends this when the WABA quality rating or messaging limit changes.
 *
 * Dispatches outbound webhook: account.quality_changed
 *
 * Meta account_update event types:
 *   - FLAGGED: account flagged for policy violation
 *   - RESTRICTED: account restricted
 *   - QUALITY_RATING_CHANGED: phone number quality changed (GREEN/YELLOW/RED)
 *   - MESSAGING_LIMIT_CHANGED: tier limit changed (1K/10K/100K/UNLIMITED)
 *   - BANNED: account banned
 *   - ACCOUNT_DELETED: account deleted
 *   - ACCOUNT_REVIEWED: account review completed
 */
@Injectable()
export class AccountUpdateListener {
  private readonly logger = new Logger(AccountUpdateListener.name);

  constructor(private readonly dispatcher: OutboundWebhookDispatcher) {}

  /**
   * Handle account update events.
   * Called by WebhookWorker when change.field === 'account_update'.
   */
  async handle(change: any, workspace: WorkspaceDocument): Promise<void> {
    if (change.field !== 'account_update') return;

    const val = change.value;
    if (!val) return;

    const workspaceId = workspace._id.toString();
    const event = val.event;

    this.logger.warn(`[AccountUpdate] WABA account event "${event}" for workspace ${workspaceId}`);

    this.dispatcher.dispatchEvent(workspaceId, 'account.quality_changed', {
      event,
      phoneNumberId: val.phone_number_id,
      currentLimit: val.current_limit || null,
      banInfo: val.ban_info || null,
      restriction: val.restriction_info || null,
      violationType: val.violation_info?.violation_type || null,
    }).catch((err) => this.logger.error(`[AccountUpdate] Dispatcher error: ${err.message}`));
  }
}
