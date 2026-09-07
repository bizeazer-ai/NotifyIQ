import { Module, Global } from '@nestjs/common';
import { RedisService } from '../common/services/redis.service.js';
import { QueueService } from './queue.service.js';
import { WebhookWorker } from './workers/webhook.worker.js';
import { SentimentWorker } from './workers/sentiment.worker.js';
import { CampaignWorker } from './workers/campaign.worker.js';
import { AiModule } from '../ai/ai.module.js';
import { DatabaseModule } from '../database/database.module.js';

@Global() // Make QueueService globally available across all modules
@Module({
  imports: [AiModule, DatabaseModule],
  providers: [RedisService, QueueService, WebhookWorker, SentimentWorker, CampaignWorker],
  exports: [QueueService],
})
export class QueuesModule {}
