import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ 
  timestamps: { createdAt: true, updatedAt: false }, // Write-only, append-only (no updates allowed)
  capped: false 
})
export class AuditLog {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Workspace', index: true })
  workspaceId: MongooseSchema.Types.ObjectId | string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  userId: MongooseSchema.Types.ObjectId | string | null; // Null if system action or API key action

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ApiKey', default: null })
  apiKeyId: MongooseSchema.Types.ObjectId | string | null; // Set if request came from API integration

  @Prop({ required: true, trim: true })
  action: string; // Action descriptor (e.g. 'contact.delete', 'user.login', 'compliance.erasure')

  @Prop({ required: true, trim: true })
  resource: string; // Entity type (e.g. 'Contact', 'Message', 'User')

  @Prop({ type: String, trim: true, default: null })
  resourceId: string | null; // Unique identifier of the resource modified

  @Prop({ type: String, trim: true, default: null })
  ipAddress: string | null;

  @Prop({ type: MongooseSchema.Types.Map, of: MongooseSchema.Types.Mixed, default: {} })
  details: Record<string, any>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Compound index for compliance lookups
AuditLogSchema.index({ workspaceId: 1, createdAt: -1 });

// Middleware/Hooks to prevent updates/deletes to guarantee immutability for compliance
AuditLogSchema.pre('updateOne', function (this: any, next: any) {
  next(new Error('Audit log records are immutable and cannot be updated.'));
});

AuditLogSchema.pre('updateMany', function (this: any, next: any) {
  next(new Error('Audit log records are immutable and cannot be updated.'));
});

AuditLogSchema.pre('deleteOne', function (this: any, next: any) {
  next(new Error('Audit log records are immutable and cannot be deleted.'));
});

AuditLogSchema.pre('deleteMany', function (this: any, next: any) {
  next(new Error('Audit log records are immutable and cannot be deleted.'));
});
