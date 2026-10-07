import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Workspace', index: true })
  workspaceId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Contact', index: true })
  contactId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true, trim: true })
  phoneNumberId: string; // The WABA active phone number ID processing this thread

  @Prop({ required: true, default: Date.now })
  lastMessageAt: Date;

  @Prop({ required: true, enum: ['positive', 'neutral', 'negative', 'urgent'], default: 'neutral' })
  sentiment: string;

  @Prop({ type: String, default: null })
  summary: string | null;

  /** Human takeover flag: when true, AI auto-replies are paused for this thread */
  @Prop({ type: Boolean, default: false })
  isHumanTakeover: boolean;

  /** Assigned staff member */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  assignedTo: MongooseSchema.Types.ObjectId | string | null;

  /** Conversation status */
  @Prop({ type: String, enum: ['open', 'pending', 'resolved'], default: 'open' })
  status: string;

  /** Timestamp of the last inbound message from customer */
  @Prop({ type: Date, default: null })
  lastInboundAt: Date | null;

  /** WhatsApp 24-hour service window expiry (lastInboundAt + 24 hours) */
  @Prop({ type: Date, default: null })
  windowExpiresAt: Date | null;
}


export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Compound index to ensure uniqueness of thread per workspace-contact-phoneNumberId
ConversationSchema.index({ workspaceId: 1, contactId: 1, phoneNumberId: 1 }, { unique: true });
// Index for sorting active chats
ConversationSchema.index({ workspaceId: 1, lastMessageAt: -1 });
