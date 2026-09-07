import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { RedisService } from '../../common/services/redis.service.js';
import { QueueName } from '../queue.service.js';
import { SentimentService } from '../../ai/sentiment.service.js';

@Injectable()
export class SentimentWorker implements OnModuleInit, OnModuleDestroy {
  private worker: Worker;

  constructor(
    private readonly redisService: RedisService,
    private readonly sentimentService: SentimentService,
  ) {}

  onModuleInit() {
    const connection = this.redisService.getClient();

    this.worker = new Worker(
      QueueName.SENTIMENT_ANALYSIS,
      async (job: Job) => {
        const { messageId, text } = job.data;
        console.log(`[SentimentWorker] Processing sentiment analysis job: ${job.id}`);

        if (!messageId || !text) {
          console.warn('[SentimentWorker] Missing messageId or text in job payload');
          return;
        }

        const sentiment = await this.sentimentService.analyzeMessageSentiment(messageId, text);
        return { messageId, sentiment };
      },
      {
        connection,
        concurrency: 10,
      },
    );

    this.worker.on('completed', (job) => {
      console.log(`[SentimentWorker] Sentiment analysis completed for job: ${job.id}`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`[SentimentWorker] Sentiment analysis failed for job ${job?.id}:`, err.message);
    });
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
      console.log('[SentimentWorker] Closed connection');
    }
  }
}
