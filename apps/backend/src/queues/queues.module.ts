import { Module, Global } from '@nestjs/common';
import { RedisService } from '../common/services/redis.service.js';
import { QueueService } from './queue.service.js';
import { WebhookWorker } from './workers/webhook.worker.js';
import { SentimentWorker } from './workers/sentiment.worker.js';
import { CampaignWorker } from './workers/campaign.worker.js';
import { AiModule } from '../ai/ai.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { FlowsModule } from '../flows/flows.module.js';
import { MessagesModule } from '../messages/messages.module.js';
import { OutboundWebhooksModule } from '../outbound-webhooks/outbound-webhooks.module.js';
import { InboundMessageListener } from './workers/listeners/inbound-message.listener.js';
import { MessageStatusListener } from './workers/listeners/message-status.listener.js';
import { TemplateStatusListener } from './workers/listeners/template-status.listener.js';
import { AccountUpdateListener } from './workers/listeners/account-update.listener.js';

@Global() // Make QueueService globally available across all modules
@Module({
  imports: [AiModule, DatabaseModule, FlowsModule, MessagesModule, OutboundWebhooksModule],
  providers: [
    RedisService,
    QueueService,
    WebhookWorker,
    SentimentWorker,
    CampaignWorker,
    InboundMessageListener,
    MessageStatusListener,
    TemplateStatusListener,
    AccountUpdateListener,
  ],
  exports: [
    QueueService,
    InboundMessageListener,
    MessageStatusListener,
    TemplateStatusListener,
    AccountUpdateListener,
  ],
})
export class QueuesModule {}

