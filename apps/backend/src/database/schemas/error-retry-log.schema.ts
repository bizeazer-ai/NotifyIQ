import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ErrorRetryLogDocument = ErrorRetryLog & Document;

export const RETRY_STATUSES = ['pending', 'retrying', 'resolved', 'failed'] as const;
export type RetryStatus = (typeof RETRY_STATUSES)[number];

@Schema({ timestamps: true })
export class ErrorRetryLog {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Workspace', index: true })
  workspaceId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: false, type: MongooseSchema.Types.ObjectId, ref: 'Message', index: true })
  messageId?: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true, type: Object })
  payload: Record<string, any>;

  @Prop({ required: true, default: 0 })
  attemptCount: number;

  @Prop({ required: true, default: 4 })
  maxAttempts: number;

  @Prop({ required: true, type: String, enum: RETRY_STATUSES, default: 'pending', index: true })
  status: RetryStatus;

  @Prop({ type: Date, default: Date.now, index: true })
  nextRetryAt: Date;

  @Prop({ type: String, default: null })
  lastError: string | null;

  @Prop({ type: Object, default: null })
  errorTrace: any;
}

export const ErrorRetryLogSchema = SchemaFactory.createForClass(ErrorRetryLog);

ErrorRetryLogSchema.index({ workspaceId: 1, status: 1 });
ErrorRetryLogSchema.index({ status: 1, nextRetryAt: 1 });
