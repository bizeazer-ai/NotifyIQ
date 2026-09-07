import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type KnowledgeDocument = Knowledge & Document;

@Schema({ timestamps: true })
export class Knowledge {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Workspace', index: true })
  workspaceId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true, index: true })
  docId: string; // Document grouping ID for chunks of the same file

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, enum: ['pdf', 'docx', 'yaml', 'json', 'csv', 'txt'], default: 'txt' })
  fileType: string;

  @Prop({ required: true, default: 0 })
  chunkIndex: number;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ type: [Number], default: [] })
  embedding: number[]; // 768-dim Gemini gemini-embedding-001 vector
}

export const KnowledgeSchema = SchemaFactory.createForClass(Knowledge);

// Create compound index for workspace and doc lookup
KnowledgeSchema.index({ workspaceId: 1, docId: 1 });
