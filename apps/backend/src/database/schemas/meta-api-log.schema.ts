import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type MetaApiLogDocument = MetaApiLog & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class MetaApiLog {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Workspace', index: true })
  workspaceId: MongooseSchema.Types.ObjectId | string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  userId: MongooseSchema.Types.ObjectId | string | null;

  @Prop({ type: String, default: null })
  businessAccountId: string | null;

  @Prop({ type: String, default: null })
  phoneNumberId: string | null;

  @Prop({ required: true, trim: true })
  endpointUrl: string;

  @Prop({ required: true, trim: true })
  httpMethod: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  requestPayload: Record<string, any> | null;

  @Prop({ type: Number, default: 200 })
  responseStatus: number;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  responseData: Record<string, any> | any;

  @Prop({ type: String, default: null })
  errorMessage: string | null;
}

export const MetaApiLogSchema = SchemaFactory.createForClass(MetaApiLog);

MetaApiLogSchema.index({ workspaceId: 1, createdAt: -1 });
