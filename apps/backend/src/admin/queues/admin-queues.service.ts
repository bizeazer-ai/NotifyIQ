import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '@notifyiq/config';
import { QueueService, QueueName } from '../../queues/queue.service.js';

@Injectable()
export class AdminQueuesService {
  private readonly logger = new Logger(AdminQueuesService.name);
  private redisConnection: IORedis | null = null;
  private queueCache: Map<string, Queue> = new Map();

  constructor(private readonly queueService: QueueService) {}

  async getQueueStatus() {
    const queueNames = Object.values(QueueName);

    // If running in in-memory fallback mode (e.g. Render testing without Redis)
    if (this.queueService.isFallbackMode()) {
      const memoryUsedMb = parseFloat((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2));
      const queues = await Promise.all(
        queueNames.map(async (name) => {
          const counts = await this.queueService.getJobCounts(name);
          const isHealthy = (counts.failed || 0) < 50;
          return {
            name,
            depth: {
              waiting: counts.waiting || 0,
              active: counts.active || 0,
              completed: counts.completed || 0,
              failed: counts.failed || 0,
              delayed: counts.delayed || 0,
            },
            status: isHealthy ? 'healthy' : 'degraded',
            workersActive: 1,
          };
        })
      );

      return {
        cluster: {
          host: 'in-process (in-memory)',
          port: 0,
          status: 'in-memory (render fallback)',
          memoryUsedMb,
        },
        queues,
      };
    }

    const redisHost = (env as any).REDIS_HOST || 'localhost';
    const redisPort = parseInt((env as any).REDIS_PORT || '6379', 10);

    try {
      if (!this.redisConnection) {
        this.redisConnection = new IORedis({
          host: redisHost,
          port: redisPort,
          password: (env as any).REDIS_PASSWORD || undefined,
          maxRetriesPerRequest: null,
          connectTimeout: 2000,
          retryStrategy: (times) => (times > 2 ? null : 500),
        });
      }

      let memoryUsedMb = 0;
      let redisStatus = 'disconnected';

      try {
        redisStatus = this.redisConnection.status;
        const info = await this.redisConnection.info('memory');
        const match = info.match(/used_memory:(\d+)/);
        if (match) {
          memoryUsedMb = parseFloat((parseInt(match[1], 10) / 1024 / 1024).toFixed(2));
        }
      } catch (redisErr) {
        console.error('Failed to fetch Redis info metrics:', redisErr);
      }

      const queues = await Promise.all(
        queueNames.map(async (name) => {
          if (!this.queueCache.has(name)) {
            this.queueCache.set(name, new Queue(name, { connection: this.redisConnection! }));
          }
          const queue = this.queueCache.get(name)!;

          try {
            const jobCounts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
            const isHealthy = jobCounts.failed < 50;
            const workers = await queue.getWorkers();

            return {
              name,
              depth: {
                waiting: jobCounts.waiting || 0,
                active: jobCounts.active || 0,
                completed: jobCounts.completed || 0,
                failed: jobCounts.failed || 0,
                delayed: jobCounts.delayed || 0,
              },
              status: isHealthy ? 'healthy' : 'degraded',
              workersActive: workers.length,
            };
          } catch (queueErr) {
            console.error(`Error fetching metrics for queue ${name}:`, queueErr);
            return {
              name,
              depth: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
              status: 'unhealthy',
              workersActive: 0,
            };
          }
        })
      );

      return {
        cluster: {
          host: redisHost,
          port: redisPort,
          status: redisStatus,
          memoryUsedMb,
        },
        queues,
      };
    } catch (globalErr) {
      console.error('Critical failure in getQueueStatus:', globalErr);
      throw new Error('Queue monitoring service temporarily unavailable');
    }
  }

  async retryFailed(queueName: string) {
    this.logger.log(`[AdminQueuesService] Retrying failed jobs for queue '${queueName}'`);

    if (this.queueService.isFallbackMode()) {
      const queue = this.queueService.getQueue(queueName);
      if (!queue) {
        return { success: false, retriedCount: 0, message: `Queue '${queueName}' not found` };
      }
      const failedJobs = await (queue as any).getFailed();
      await Promise.all(failedJobs.map((job: any) => job.retry()));

      return {
        success: true,
        retriedCount: failedJobs.length,
        message: `Successfully retried ${failedJobs.length} failed jobs in queue '${queueName}' (in-memory fallback)`,
      };
    }

    if (!this.queueCache.has(queueName)) {
      const redisHost = (env as any).REDIS_HOST || 'localhost';
      const redisPort = parseInt((env as any).REDIS_PORT || '6379', 10);
      if (!this.redisConnection) {
        this.redisConnection = new IORedis({
          host: redisHost,
          port: redisPort,
          password: (env as any).REDIS_PASSWORD || undefined,
          maxRetriesPerRequest: null,
        });
      }
      this.queueCache.set(queueName, new Queue(queueName, { connection: this.redisConnection }));
    }
    const queue = this.queueCache.get(queueName)!;
    const failedJobs = await queue.getFailed();
    await Promise.all(failedJobs.map((job) => job.retry()));

    return {
      success: true,
      retriedCount: failedJobs.length,
      message: `Successfully retried ${failedJobs.length} failed jobs in queue '${queueName}'`,
    };
  }

  async cleanQueue(queueName: string) {
    this.logger.log(`[AdminQueuesService] Purging completed and failed jobs for queue '${queueName}'`);

    if (this.queueService.isFallbackMode()) {
      const queue = this.queueService.getQueue(queueName);
      if (!queue) {
        return { success: false, cleanedCount: 0, message: `Queue '${queueName}' not found` };
      }
      const cleanedCompleted = await (queue as any).clean(0, 1000, 'completed');
      const cleanedFailed = await (queue as any).clean(0, 1000, 'failed');

      return {
        success: true,
        cleanedCount: cleanedCompleted.length + cleanedFailed.length,
        message: `Purged ${cleanedCompleted.length} completed and ${cleanedFailed.length} failed jobs from queue '${queueName}' (in-memory fallback)`,
      };
    }

    if (!this.queueCache.has(queueName)) {
      const redisHost = (env as any).REDIS_HOST || 'localhost';
      const redisPort = parseInt((env as any).REDIS_PORT || '6379', 10);
      if (!this.redisConnection) {
        this.redisConnection = new IORedis({
          host: redisHost,
          port: redisPort,
          password: (env as any).REDIS_PASSWORD || undefined,
          maxRetriesPerRequest: null,
        });
      }
      this.queueCache.set(queueName, new Queue(queueName, { connection: this.redisConnection }));
    }
    const queue = this.queueCache.get(queueName)!;
    const cleanedCompleted = await queue.clean(0, 1000, 'completed');
    const cleanedFailed = await queue.clean(0, 1000, 'failed');

    return {
      success: true,
      cleanedCount: cleanedCompleted.length + cleanedFailed.length,
      message: `Purged ${cleanedCompleted.length} completed and ${cleanedFailed.length} failed jobs from queue '${queueName}'`,
    };
  }
}
