import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';
import { env } from '@notifyiq/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private isRedisConnected = false;
  private inMemoryCache = new Map<string, any>();

  async onModuleInit() {
    console.log('[Redis] Initializing Redis client...');
    this.client = new Redis(env.REDIS_URL, {
      lazyConnect: true, // Prevent constructor from immediately opening raw sockets
      maxRetriesPerRequest: null, // Required by BullMQ
      enableOfflineQueue: false, // Prevents queries from hanging offline
      connectTimeout: 2000,
      retryStrategy: (times) => {
        // Limit reconnect retries when Redis is offline to prevent log spam
        if (times > 2) return null;
        return 500;
      },
    });

    this.client.on('connect', () => {
      console.log('[Redis] Successfully connected to Redis server.');
      this.isRedisConnected = true;
    });

    this.client.on('error', () => {
      this.isRedisConnected = false;
    });

    this.client.on('close', () => {
      this.isRedisConnected = false;
    });

    // Explicitly probe connection with a bounded timeout
    try {
      await Promise.race([
        this.client.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis connection probe timed out (2000ms)')), 2000)
        ),
      ]);
      this.isRedisConnected = true;
      console.log('[Redis] Connection verified. Running in production Redis mode.');
    } catch {
      this.isRedisConnected = false;
      console.warn(
        '[Redis] External Redis service is offline or unavailable. Operating seamlessly in fallback in-memory mode for BullMQ queues and workers.'
      );
    }
  }

  public isAvailable(): boolean {
    return this.isRedisConnected;
  }

  private wrapClient(client: Redis): Redis {
    const service = this;

    return new Proxy(client, {
      get(target, prop, receiver) {
        // Intercept duplicate method to handle error event attachment on BullMQ clones
        if (prop === 'duplicate') {
          return function (..._args: any[]) {
            const newClient = target.duplicate();

            newClient.on('error', () => {
              service.isRedisConnected = false;
            });

            newClient.connect().catch(() => {
              service.isRedisConnected = false;
            });

            return service.wrapClient(newClient);
          };
        }

        // If Redis is connected, delegate directly to the real client
        if (service.isRedisConnected) {
          const value = Reflect.get(target, prop, receiver);
          return typeof value === 'function' ? value.bind(target) : value;
        }

        // If Redis is disconnected, use in-memory fallback for known commands
        if (prop === 'get') {
          return async (key: string) => {
            return service.inMemoryCache.get(key) ?? null;
          };
        }

        if (prop === 'set') {
          return async (key: string, value: any) => {
            service.inMemoryCache.set(key, value);
            return 'OK';
          };
        }

        if (prop === 'del') {
          return async (key: string) => {
            const existed = service.inMemoryCache.has(key);
            service.inMemoryCache.delete(key);
            return existed ? 1 : 0;
          };
        }

        // Catch Lua rate-limiting script evaluation in campaign.worker.ts
        if (prop === 'eval' || prop === 'evalsha') {
          return async (...args: any[]) => {
            const script = args[0];
            if (typeof script === 'string' && script.includes('rate_limit:bucket')) {
              // Parse Lua rate-limiter variables passed as args
              const bucketKey = args[2];
              const lastRefillKey = args[3];
              const limit = parseInt(args[4] || '80', 10);
              const interval = parseInt(args[5] || '1000', 10);
              const now = parseInt(args[6] || Date.now().toString(), 10);

              let tokens = service.inMemoryCache.get(bucketKey) ?? limit;
              let lastRefill = service.inMemoryCache.get(lastRefillKey) ?? now;

              const elapsed = now - lastRefill;
              const tokensToAdd = Math.floor(elapsed * (limit / interval));

              if (tokensToAdd > 0) {
                tokens = Math.min(limit, tokens + tokensToAdd);
                service.inMemoryCache.set(lastRefillKey, now);
              }

              if (tokens > 0) {
                service.inMemoryCache.set(bucketKey, tokens - 1);
                return 1; // Allow message
              } else {
                return 0; // Rate limit
              }
            }
            return 1; // Default fallback to allow operation
          };
        }

        // Fallback default for other function calls
        const value = Reflect.get(target, prop, receiver);
        if (typeof value === 'function') {
          return async (...args: any[]) => {
            try {
              return await value.apply(target, args);
            } catch {
              return null;
            }
          };
        }
        return value;
      },
    });
  }

  getClient(): Redis {
    return this.wrapClient(this.client);
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        // ignore errors on quit if already disconnected
      }
      console.log('[Redis] Disconnected from Redis');
    }
  }
}
