import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AiUsageEventDocument = AiUsageEvent & Document;

@Schema({ timestamps: true })
export class AiUsageEvent {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Workspace', index: true })
  workspaceId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true, enum: ['sentiment', 'reply', 'transcription', 'chatbot'], index: true })
  feature: string;

  @Prop({ required: true, trim: true })
  model: string; // e.g. 'claude-3-5-sonnet', 'whisper-large-v3', 'text-embedding-3-small'

  @Prop({ required: true, default: 0 })
  promptTokens: number;

  @Prop({ required: true, default: 0 })
  completionTokens: number;

  @Prop({ required: true, default: 0 })
  estimatedCost: number; // in USD

  @Prop({ required: true, default: false, index: true })
  flaggedForReview: boolean;

  @Prop({ type: String, default: null })
  flagReason: string | null; // e.g. 'prompt_injection_attempt', 'toxic_content_detected'

  @Prop({ type: String, enum: ['pending', 'dismissed', 'warned', 'restricted'], default: 'pending' })
  actionStatus: string;
}

export const AiUsageEventSchema = SchemaFactory.createForClass(AiUsageEvent);

AiUsageEventSchema.index({ workspaceId: 1, createdAt: -1 });
AiUsageEventSchema.index({ feature: 1, createdAt: -1 });
AiUsageEventSchema.index({ flaggedForReview: 1, actionStatus: 1 });
