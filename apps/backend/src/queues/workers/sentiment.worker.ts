import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { QueueService, QueueName, UnifiedWorker } from '../queue.service.js';
import { SentimentService } from '../../ai/sentiment.service.js';

@Injectable()
export class SentimentWorker implements OnModuleInit, OnModuleDestroy {
  private worker: UnifiedWorker;

  constructor(
    private readonly queueService: QueueService,
    private readonly sentimentService: SentimentService,
  ) {}

  onModuleInit() {
    this.worker = this.queueService.createWorker(
      QueueName.SENTIMENT_ANALYSIS,
      async (job: any) => {
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
        concurrency: 10,
      },
    );

    this.worker.on('completed', (job: any) => {
      console.log(`[SentimentWorker] Sentiment analysis completed for job: ${job.id}`);
    });

    this.worker.on('failed', (job: any, err: any) => {
      console.error(`[SentimentWorker] Sentiment analysis failed for job ${job?.id}:`, err?.message || err);
    });
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
      console.log('[SentimentWorker] Closed connection');
    }
  }
}
