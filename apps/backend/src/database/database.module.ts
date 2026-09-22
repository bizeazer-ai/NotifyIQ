import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Workspace, WorkspaceSchema } from './schemas/workspace.schema.js';
import { User, UserSchema } from './schemas/user.schema.js';
import { Contact, ContactSchema } from './schemas/contact.schema.js';
import { Conversation, ConversationSchema } from './schemas/conversation.schema.js';
import { Message, MessageSchema } from './schemas/message.schema.js';
import { ApiKey, ApiKeySchema } from './schemas/api-key.schema.js';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema.js';
import { Knowledge, KnowledgeSchema } from './schemas/knowledge.schema.js';
import { Flow, FlowSchema } from './schemas/flow.schema.js';
import { MetaApiLog, MetaApiLogSchema } from './schemas/meta-api-log.schema.js';
import { SuperAdmin, SuperAdminSchema } from './schemas/super-admin.schema.js';
import { AdminAuditLog, AdminAuditLogSchema } from './schemas/admin-audit-log.schema.js';
import { AdminSession, AdminSessionSchema } from './schemas/admin-session.schema.js';
import { Coupon, CouponSchema } from './schemas/coupon.schema.js';
import { AiUsageEvent, AiUsageEventSchema } from './schemas/ai-usage-event.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: User.name, schema: UserSchema },
      { name: Contact.name, schema: ContactSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: ApiKey.name, schema: ApiKeySchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: Knowledge.name, schema: KnowledgeSchema },
      { name: Flow.name, schema: FlowSchema },
      { name: MetaApiLog.name, schema: MetaApiLogSchema },
      { name: SuperAdmin.name, schema: SuperAdminSchema },
      { name: AdminAuditLog.name, schema: AdminAuditLogSchema },
      { name: AdminSession.name, schema: AdminSessionSchema },
      { name: Coupon.name, schema: CouponSchema },
      { name: AiUsageEvent.name, schema: AiUsageEventSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
