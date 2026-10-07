import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type OutboundWebhookDocument = OutboundWebhook & Document;

export const VALID_EVENT_TYPES = [
  'message.inbound',
  'message.status',
  'ai.replied',
  'sentiment.analyzed',
  'human.handover',
  'lead.status_changed',
  'flow.executed',
  'template.status_changed',
  'account.quality_changed',
  '*',
] as const;

export type OutboundWebhookEventType = (typeof VALID_EVENT_TYPES)[number];

@Schema({ timestamps: true })
export class OutboundWebhook {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Workspace', index: true })
  workspaceId: MongooseSchema.Types.ObjectId | string;

  /** Human-readable label for this endpoint (e.g. "CRM Integration") */
  @Prop({ required: true, trim: true, maxlength: 120 })
  description: string;

  /** Customer's HTTPS endpoint URL that will receive event payloads */
  @Prop({ required: true, trim: true })
  url: string;

  /**
   * AES-256-GCM encrypted HMAC secret. Used to sign every outbound payload with
   * X-NotifyIQ-Signature-256: sha256=<hmac>
   */
  @Prop({ required: true })
  secret: string;

  /**
   * Event subscriptions. ['*'] means all events.
   * Specific subscriptions: ['message.inbound', 'ai.replied']
   */
  @Prop({ type: [String], default: ['*'] })
  events: string[];

  /** Toggle to temporarily disable without deleting */
  @Prop({ default: true })
  isActive: boolean;

  /** Consecutive delivery failure count. Auto-disabled at 50. */
  @Prop({ default: 0 })
  failureCount: number;

  /** Last delivery attempt metadata */
  @Prop({
    type: {
      status: { type: String, enum: ['success', 'failed'], default: null },
      statusCode: { type: Number, default: null },
      at: { type: Date, default: null },
      error: { type: String, default: null },
    },
    default: null,
  })
  lastDelivery: {
    status: 'success' | 'failed' | null;
    statusCode: number | null;
    at: Date | null;
    error: string | null;
  } | null;
}

export const OutboundWebhookSchema = SchemaFactory.createForClass(OutboundWebhook);

// Fast lookup for dispatcher: workspace → active endpoints
OutboundWebhookSchema.index({ workspaceId: 1, isActive: 1 });
