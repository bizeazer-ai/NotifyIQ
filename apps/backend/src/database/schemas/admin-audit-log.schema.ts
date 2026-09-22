import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AdminAuditLogDocument = AdminAuditLog & Document;

@Schema({
  timestamps: { createdAt: true, updatedAt: false }, // Write-only, append-only
})
export class AdminAuditLog {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'SuperAdmin', index: true })
  superAdminId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true, trim: true, lowercase: true })
  adminEmail: string;

  @Prop({ required: true, trim: true })
  role: string;

  @Prop({ required: true, trim: true })
  action: string; // e.g. 'workspace.suspend', 'billing.refund', 'impersonate.start'

  @Prop({ required: true, trim: true })
  targetEntity: string; // e.g. 'Workspace', 'User', 'SuperAdmin', 'Billing'

  @Prop({ type: String, trim: true, default: null })
  targetId: string | null;

  @Prop({ type: MongooseSchema.Types.Map, of: MongooseSchema.Types.Mixed, default: {} })
  beforeSnapshot: Record<string, any>;

  @Prop({ type: MongooseSchema.Types.Map, of: MongooseSchema.Types.Mixed, default: {} })
  afterSnapshot: Record<string, any>;

  @Prop({ type: String, trim: true, default: null })
  ipAddress: string | null;

  @Prop({ type: String, trim: true, default: null })
  userAgent: string | null;

  @Prop({ type: String, trim: true, default: null })
  reasonCode: string | null;
}

export const AdminAuditLogSchema = SchemaFactory.createForClass(AdminAuditLog);

AdminAuditLogSchema.index({ superAdminId: 1, createdAt: -1 });
AdminAuditLogSchema.index({ targetEntity: 1, targetId: 1, createdAt: -1 });
AdminAuditLogSchema.index({ action: 1, createdAt: -1 });

// Immutability pre-hooks to guarantee audit integrity
AdminAuditLogSchema.pre('updateOne', function (this: any, next: any) {
  next(new Error('Admin audit log records are immutable and cannot be updated.'));
});

AdminAuditLogSchema.pre('updateMany', function (this: any, next: any) {
  next(new Error('Admin audit log records are immutable and cannot be updated.'));
});

AdminAuditLogSchema.pre('deleteOne', function (this: any, next: any) {
  next(new Error('Admin audit log records are immutable and cannot be deleted.'));
});

AdminAuditLogSchema.pre('deleteMany', function (this: any, next: any) {
  next(new Error('Admin audit log records are immutable and cannot be deleted.'));
});
