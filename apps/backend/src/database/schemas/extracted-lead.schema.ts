import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ExtractedLeadDocument = ExtractedLead & Document;

export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

@Schema({ timestamps: true })
export class ExtractedLead {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Workspace', index: true })
  workspaceId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Contact', index: true })
  contactId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true, trim: true, index: true })
  contactPhone: string;

  @Prop({ type: String, trim: true, default: null })
  name: string | null;

  @Prop({ type: String, trim: true, default: null })
  email: string | null;

  /** Business category tag (e.g. "Wholesale", "Puja Items", "Jewelry") */
  @Prop({ type: String, trim: true, default: 'General', index: true })
  category: string;

  /** Extracted budget or deal size */
  @Prop({ type: String, trim: true, default: null })
  budget: string | null;

  /** Identified product or service interest */
  @Prop({ type: String, trim: true, default: null })
  productInterest: string | null;

  /** Lead qualification status */
  @Prop({ required: true, type: String, enum: LEAD_STATUSES, default: 'new', index: true })
  status: LeadStatus;

  /** Unstructured notes or chat snippet from extraction */
  @Prop({ type: String, default: null })
  rawNotes: string | null;

  /** Confidence score of the extraction (0.0 to 1.0) */
  @Prop({ type: Number, default: 0.85 })
  confidence: number;

  @Prop({ default: Date.now })
  extractedAt: Date;
}

export const ExtractedLeadSchema = SchemaFactory.createForClass(ExtractedLead);

ExtractedLeadSchema.index({ workspaceId: 1, contactPhone: 1 }, { unique: true });
ExtractedLeadSchema.index({ workspaceId: 1, status: 1 });
ExtractedLeadSchema.index({ workspaceId: 1, category: 1 });
