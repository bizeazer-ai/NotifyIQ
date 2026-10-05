import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Queue, Worker, WorkerOptions } from 'bullmq';
import { RedisService } from '../common/services/redis.service.js';
import { InMemoryQueue, InMemoryWorker, InMemoryProcessor } from './in-memory/index.js';

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

export interface IUnifiedWorker {
  on(event: 'completed', listener: (job: any, result?: any) => void): this;
  on(event: 'failed', listener: (job: any, error: any) => void): this;
  on(event: 'progress', listener: (job: any, progress: any) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  on(event: string, listener: (...args: any[]) => void): this;
  close(): Promise<void>;
  pause?(): Promise<void>;
  resume?(): Promise<void>;
}

export type UnifiedQueue = Queue | InMemoryQueue;
export type UnifiedWorker = IUnifiedWorker;

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private queues: Map<string, UnifiedQueue> = new Map();
  private workers: Map<string, UnifiedWorker> = new Map();

  constructor(private readonly redisService: RedisService) {}

  onModuleInit() {
    const isRedisReady = this.redisService.isAvailable();
    const defaultJobOptions = {
      attempts: 3,
      backoff: {
        type: 'exponential' as const,
        delay: 1000, // starting delay: 1s, then 2s, then 4s
      },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
    };

    if (isRedisReady) {
      this.logger.log('External Redis online. Initializing native BullMQ queues...');
      const connection = this.redisService.getClient();

      Object.values(QueueName).forEach((queueName) => {
        const queue = new Queue(queueName, {
          connection,
          defaultJobOptions,
        });

        this.queues.set(queueName, queue);
        this.logger.log(`Initialized BullMQ queue: ${queueName}`);
      });
    } else {
      this.logger.warn(
        'External Redis offline/unavailable. Initializing pure TypeScript InMemoryQueues (fallback engine for Render/testing)...'
      );

      Object.values(QueueName).forEach((queueName) => {
        const queue = new InMemoryQueue(queueName, {
          defaultJobOptions,
        });

        this.queues.set(queueName, queue);
        this.logger.log(`Initialized InMemory fallback queue: ${queueName}`);
      });
    }
  }

  /**
   * Factory method to create a Worker that transparently runs BullMQ or InMemoryWorker
   */
  createWorker<T = any>(
    queueName: QueueName | string,
    processor: InMemoryProcessor<T>,
    options: Partial<WorkerOptions> & { concurrency?: number } = {},
  ): UnifiedWorker {
    const isRedisReady = this.redisService.isAvailable();

    if (isRedisReady) {
      const connection = this.redisService.getClient();
      const worker = new Worker(queueName, processor as any, {
        connection,
        concurrency: options.concurrency || 1,
        ...options,
      });

      const unifiedWorker = worker as unknown as UnifiedWorker;
      this.workers.set(queueName, unifiedWorker);
      this.logger.log(`Created native BullMQ worker for '${queueName}' (concurrency: ${options.concurrency || 1})`);
      return unifiedWorker;
    } else {
      const worker = new InMemoryWorker<T>(queueName, processor, {
        concurrency: options.concurrency || 1,
        ...options,
      });

      const unifiedWorker = worker as unknown as UnifiedWorker;
      this.workers.set(queueName, unifiedWorker);
      this.logger.log(`Created InMemory fallback worker for '${queueName}' (concurrency: ${options.concurrency || 1})`);
      return unifiedWorker;
    }
  }

  async addJob<T>(queueName: QueueName | string, jobName: string, data: T, jobId?: string, opts?: any): Promise<any> {
    let queue = this.queues.get(queueName);
    if (!queue) {
      // Dynamic fallback queue creation if queueName wasn't in enum
      if (this.redisService.isAvailable()) {
        queue = new Queue(queueName, { connection: this.redisService.getClient() });
      } else {
        queue = new InMemoryQueue(queueName);
      }
      this.queues.set(queueName, queue);
    }
    return (queue as any).add(jobName, data, { jobId, ...opts });
  }

  getQueue(queueName: QueueName | string): UnifiedQueue | undefined {
    return this.queues.get(queueName);
  }

  isFallbackMode(): boolean {
    return !this.redisService.isAvailable();
  }

  async getJobCounts(queueName: QueueName | string): Promise<Record<string, number>> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    }
    return (queue as any).getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
  }

  async onModuleDestroy() {
    for (const [name, worker] of this.workers.entries()) {
      await worker.close();
      this.logger.log(`Closed worker: ${name}`);
    }
    for (const [name, queue] of this.queues.entries()) {
      await queue.close();
      this.logger.log(`Closed queue: ${name}`);
    }
  }
}
