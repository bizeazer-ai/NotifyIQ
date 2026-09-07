import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ApiKeyDocument = ApiKey & Document;

@Schema({ timestamps: true })
export class ApiKey {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Workspace', index: true })
  workspaceId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true, trim: true })
  name: string; // Friendly name to identify the key (e.g. "Zynkrit Integration")

  @Prop({ required: true, trim: true, index: true })
  keyPrefix: string; // The prefix (e.g. "nq_live_a1b2c3d4") to locate the key without exposing full credentials

  @Prop({ required: true })
  keyHash: string; // Bcrypt hash of the full API key secret

  @Prop({ type: [String], enum: ['send', 'read', 'webhook'], default: ['send'] })
  scopes: string[];

  @Prop({ type: Date, default: null })
  lastUsedAt: Date | null;

  @Prop({ type: Date, default: null })
  expiresAt: Date | null;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);

// Compound index to verify key prefix per workspace
ApiKeySchema.index({ workspaceId: 1, keyPrefix: 1 });
