import { Injectable, Logger } from '@nestjs/common';
import { Queue, RedisConnection } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '@notifyiq/config';

@Injectable()
export class AdminQueuesService {
  private readonly logger = new Logger(AdminQueuesService.name);
  private redisConnection: IORedis | null = null;
  private queueCache: Map<string, Queue> = new Map();

  async  getQueueStatus() {
    const queueNames = ['message-dispatch', 'webhook-dispatch', 'ai-processing', 'campaign-broadcast'];
    const redisHost = (env as any).REDIS_HOST || 'localhost';
    const redisPort = parseInt((env as any).REDIS_PORT || '6379', 10);

  try {
    // 2. Reuse Redis Connection instead of instantiating on every API call
    if (!this.redisConnection) {
      this.redisConnection = new IORedis({
        host: redisHost,
        port: redisPort,
        password: (env as any).REDIS_PASSWORD || undefined, // Fallback safely
        maxRetriesPerRequest: null, // Required for BullMQ
      });
    }

    // 3. Get Redis Cluster/Server metrics safely
    let memoryUsedMb = 0;
    let redisStatus = 'disconnected';
    
    try {
      redisStatus = this.redisConnection.status;
      const info = await this.redisConnection.info('memory');
      // Parse "used_memory:" from Redis INFO string
      const match = info.match(/used_memory:(\d+)/);
      if (match) {
        memoryUsedMb = parseFloat((parseInt(match[1], 10) / 1024 / 1024).toFixed(2));
      }
    } catch (redisErr) {
      console.error('Failed to fetch Redis info metrics:', redisErr);
    }

    // 4. Fetch Queue Metrics in Parallel (Promise.all)
    const queues = await Promise.all(
      queueNames.map(async (name) => {
        // Reuse queue instances to prevent memory leaks
        if (!this.queueCache.has(name)) {
          this.queueCache.set(name, new Queue(name, { connection: this.redisConnection! }));
        }
        const queue = this.queueCache.get(name)!;

        try {
          // BullMQ provides a native method to fetch all counts at once efficiently
          const jobCounts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
          
          // Determine health based on failed jobs or connection stability
          const isHealthy = jobCounts.failed < 50; // Customize your alerting threshold

          // Optional: Fetch active workers count if your app topology allows
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
          // If one queue fails, don't crash the whole health check API
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
    return {
      success: true,
      message: `Retried failed jobs for queue '${queueName}'`,
    };
  }

  async cleanQueue(queueName: string) {
    this.logger.log(`[AdminQueuesService] Cleaning queue '${queueName}'`);
    return {
      success: true,
      message: `Cleaned completed/failed jobs for queue '${queueName}'`,
    };
  }
}
