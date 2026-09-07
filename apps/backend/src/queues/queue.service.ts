import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import { RedisService } from '../common/services/redis.service.js';

export enum QueueName {
  WEBHOOK_PROCESSOR = 'webhook-processor',
  CAMPAIGN = 'campaign',
  AUDIO_PROCESSOR = 'audio-processor',
  SENTIMENT_ANALYSIS = 'sentiment-analysis',
  AI_REPLY = 'ai-reply',
  CHATBOT = 'chatbot',
  SEGMENTATION = 'segmentation',
  COMPLIANCE = 'compliance',
}

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private queues: Map<QueueName, Queue> = new Map();

  constructor(private readonly redisService: RedisService) {}

  onModuleInit() {
    const connection = this.redisService.getClient();

    // Initialize all 8 queues specified in the BRD
    Object.values(QueueName).forEach((queueName) => {
      const queue = new Queue(queueName, {
        connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000, // starting delay: 1s, then 2s, then 4s
          },
          removeOnComplete: { count: 1000 }, // clean up old completed jobs
          removeOnFail: { count: 5000 },
        },
      });

      this.queues.set(queueName, queue);
      console.log(`[QueueService] Initialized queue: ${queueName}`);
    });
  }

  async addJob<T>(queueName: QueueName, jobName: string, data: T, jobId?: string): Promise<any> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} is not initialized`);
    }
    return queue.add(jobName, data, { jobId });
  }

  async onModuleDestroy() {
    for (const [name, queue] of this.queues.entries()) {
      await queue.close();
      console.log(`[QueueService] Closed queue: ${name}`);
    }
  }
}
