import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { env } from '@notifyiq/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './auth/auth.module.js';
import { QueuesModule } from './queues/queues.module.js';
import { WebhookModule } from './webhook/webhook.module.js';
import { MetaModule } from './meta/meta.module.js';
import { SocketModule } from './socket/socket.module.js';
import { MessagesModule } from './messages/messages.module.js';
import { AiModule } from './ai/ai.module.js';
import { ComplianceModule } from './compliance/compliance.module.js';
import { BillingModule } from './billing/billing.module.js';
import { WorkspacesModule } from './workspaces/workspaces.module.js';
import { FlowsModule } from './flows/flows.module.js';
import { ContactsModule } from './contacts/contacts.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { AdminModule } from './admin/admin.module.js';
import { OutboundWebhooksModule } from './outbound-webhooks/outbound-webhooks.module.js';
import { ApiKeysModule } from './api-keys/api-keys.module.js';

@Module({
  imports: [
    MongooseModule.forRoot(env.DB_URI),
    DatabaseModule,
    QueuesModule,
    SocketModule,
    AuthModule,
    AdminModule,
    WebhookModule,
    MetaModule,
    MessagesModule,
    AiModule,
    ComplianceModule,
    BillingModule,
    WorkspacesModule,
    FlowsModule,
    ContactsModule,
    AnalyticsModule,
    OutboundWebhooksModule,
    ApiKeysModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
