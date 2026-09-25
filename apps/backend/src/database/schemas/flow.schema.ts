import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type FlowDocument = Flow & Document;

@Schema({ timestamps: true })
export class Flow {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Workspace', index: true })
  workspaceId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true, default: '' })
  description: string;

  @Prop({ type: Array, default: [] })
  nodes: any[]; // Stores ReactFlow node objects: { id, type, data, position }

  @Prop({ type: Array, default: [] })
  edges: any[]; // Stores ReactFlow edge objects: { id, source, target }

  @Prop({ type: Boolean, default: false })
  active: boolean;

  @Prop({ type: Number, default: 10 })
  priority: number;
}

export const FlowSchema = SchemaFactory.createForClass(Flow);

FlowSchema.index({ workspaceId: 1 });
FlowSchema.index({ workspaceId: 1, active: 1, priority: -1 });

