import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AdminSessionDocument = AdminSession & Document;

@Schema({ timestamps: true })
export class AdminSession {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'SuperAdmin', index: true })
  superAdminId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true, unique: true })
  tokenHash: string;

  @Prop({ type: String, default: null })
  ipAddress: string | null;

  @Prop({ type: String, default: null })
  userAgent: string | null;

  @Prop({ required: true, type: Date })
  expiresAt: Date;

  @Prop({ required: true, type: Date, default: Date.now })
  lastActivityAt: Date;

  @Prop({ required: true, default: true })
  isValid: boolean;
}

export const AdminSessionSchema = SchemaFactory.createForClass(AdminSession);

AdminSessionSchema.index({ superAdminId: 1, isValid: 1 });
AdminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL auto-cleanup
