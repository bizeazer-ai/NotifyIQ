import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Workspace } from './workspace.schema.js';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Workspace', index: true })
  workspaceId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, enum: ['admin', 'agent'], default: 'agent' })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Compound index to guarantee uniqueness of email within a specific workspace
UserSchema.index({ workspaceId: 1, email: 1 }, { unique: true });
