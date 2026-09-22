import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SuperAdminDocument = SuperAdmin & Document;

export enum SuperAdminRole {
  PLATFORM_OWNER = 'platform_owner',
  PLATFORM_ADMIN = 'platform_admin',
  SUPPORT_AGENT = 'support_agent',
  BILLING_OPS = 'billing_ops',
  COMPLIANCE_OFFICER = 'compliance_officer',
  READ_ONLY_AUDITOR = 'read_only_auditor',
}

@Schema({ timestamps: true })
export class SuperAdmin {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, enum: Object.values(SuperAdminRole), default: SuperAdminRole.SUPPORT_AGENT })
  role: string;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ type: String, default: null })
  totpSecret: string | null;

  @Prop({ required: true, default: false })
  isTotpEnabled: boolean;

  @Prop({type:String, default: null})
  pendingTotpSecret: string | null ;

  @Prop({ type: [String], default: [] })
  backupCodes: string[];

  @Prop({ type: [String], default: [] })
  pendingBackupCodes: string[] | null;

  @Prop({ type: Date, default: null })
  pendingTotpSetupExpiresAt: Date | null;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop({ required: true, default: false })
  forcePasswordReset: boolean;

  @Prop({ type: [String], default: [] })
  ipAllowList: string[];

  @Prop({ type: Date, default: null })
  lastLoginAt: Date | null;

  @Prop({ type: Number, default: 0 })
  failedLoginAttempts: number;

  @Prop({ type: Date, default: null })
  lockoutUntil: Date | null;
}

export const SuperAdminSchema = SchemaFactory.createForClass(SuperAdmin);

SuperAdminSchema.index({ email: 1 }, { unique: true });
