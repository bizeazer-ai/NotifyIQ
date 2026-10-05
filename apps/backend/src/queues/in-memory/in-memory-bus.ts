import { InMemoryJob } from './in-memory-job.js';

export interface InMemoryWorkerRef {
  concurrency: number;
  isPaused: boolean;
  isClosed: boolean;
  processor: (job: InMemoryJob) => Promise<any>;
  emit: (event: string, ...args: any[]) => boolean;
}

export interface QueueState {
  waiting: InMemoryJob[];
  active: Map<string, InMemoryJob>;
  completed: InMemoryJob[];
  failed: InMemoryJob[];
  delayed: Map<string, { job: InMemoryJob; timer: NodeJS.Timeout }>;
  worker?: InMemoryWorkerRef;
}

export class InMemoryQueueBroker {
  private static instance: InMemoryQueueBroker;
  private queues: Map<string, QueueState> = new Map();

  private constructor() {}

  public static getInstance(): InMemoryQueueBroker {
    if (!InMemoryQueueBroker.instance) {
      InMemoryQueueBroker.instance = new InMemoryQueueBroker();
    }
    return InMemoryQueueBroker.instance;
  }

  private getOrCreateQueue(queueName: string): QueueState {
    let state = this.queues.get(queueName);
    if (!state) {
      state = {
        waiting: [],
        active: new Map(),
        completed: [],
        failed: [],
        delayed: new Map(),
      };
      this.queues.set(queueName, state);
    }
    return state;
  }

  public registerWorker(queueName: string, worker: InMemoryWorkerRef): void {
    const state = this.getOrCreateQueue(queueName);
    state.worker = worker;
    console.log(`[InMemoryQueueBroker] Registered in-memory worker for queue: '${queueName}' (concurrency: ${worker.concurrency})`);
    // Process any jobs that were queued before worker registered
    this.dispatch(queueName);
  }

  public unregisterWorker(queueName: string, worker: InMemoryWorkerRef): void {
    const state = this.queues.get(queueName);
    if (state && state.worker === worker) {
      state.worker = undefined;
      console.log(`[InMemoryQueueBroker] Unregistered in-memory worker for queue: '${queueName}'`);
    }
  }

  public async enqueue(queueName: string, job: InMemoryJob): Promise<void> {
    const state = this.getOrCreateQueue(queueName);

    // Setup retry callback on job so job.retry() can be invoked from admin
    job.setRetryHandler(async () => {
      // Remove from failed if present
      state.failed = state.failed.filter((j) => j.id !== job.id);
      job.attemptsMade = 0;
      job.failedReason = undefined;
      state.waiting.unshift(job);
      this.dispatch(queueName);
    });

    const delay = job.opts.delay || 0;
    if (delay > 0) {
      const timer = setTimeout(() => {
        state.delayed.delete(job.id);
        state.waiting.push(job);
        this.dispatch(queueName);
      }, delay);
      state.delayed.set(job.id, { job, timer });
    } else {
      state.waiting.push(job);
      // Process asynchronously on next tick to match BullMQ non-blocking behavior
      setImmediate(() => this.dispatch(queueName));
    }
  }

  public dispatch(queueName: string): void {
    const state = this.queues.get(queueName);
    if (!state || !state.worker || state.worker.isClosed || state.worker.isPaused) {
      return;
    }

    const worker = state.worker;

    while (state.active.size < worker.concurrency && state.waiting.length > 0) {
      const job = state.waiting.shift();
      if (!job) break;

      state.active.set(job.id, job);
      job.processedOn = Date.now();
      job.attemptsMade += 1;

      // Attach progress handler to emit worker progress event
      job.setProgressHandler((progress) => {
        worker.emit('progress', job, progress);
      });

      this.executeJob(queueName, worker, job);
    }
  }

  private async executeJob(queueName: string, worker: InMemoryWorkerRef, job: InMemoryJob): Promise<void> {
    const state = this.queues.get(queueName);
    if (!state) return;

    try {
      const result = await worker.processor(job);
      job.finishedOn = Date.now();
      job.returnvalue = result;

      state.active.delete(job.id);

      // Handle retention options
      const removeOnComplete = job.opts.removeOnComplete;
      if (removeOnComplete !== true) {
        state.completed.push(job);
        const maxCompleted = typeof removeOnComplete === 'object' && removeOnComplete.count ? removeOnComplete.count : 1000;
        if (state.completed.length > maxCompleted) {
          state.completed.splice(0, state.completed.length - maxCompleted);
        }
      }

      worker.emit('completed', job, result);

      if (state.waiting.length === 0 && state.active.size === 0) {
        worker.emit('drained');
      }
    } catch (err: any) {
      state.active.delete(job.id);
      job.failedReason = err?.message || String(err);
      job.stacktrace.push(err?.stack || String(err));

      const maxAttempts = job.opts.attempts ?? 1;
      if (job.attemptsMade < maxAttempts) {
        // Calculate backoff
        let delayMs = 1000;
        const backoff = job.opts.backoff;
        if (backoff) {
          if (backoff.type === 'exponential') {
            delayMs = (backoff.delay || 1000) * Math.pow(2, job.attemptsMade - 1);
          } else {
            delayMs = backoff.delay || 1000;
          }
        }

        console.warn(`[InMemoryQueueBroker] Job ${job.id} in '${queueName}' failed (attempt ${job.attemptsMade}/${maxAttempts}). Retrying in ${delayMs}ms... Error: ${job.failedReason}`);

        const timer = setTimeout(() => {
          state.delayed.delete(job.id);
          state.waiting.unshift(job); // High priority on retry
          this.dispatch(queueName);
        }, delayMs);

        state.delayed.set(job.id, { job, timer });
      } else {
        job.finishedOn = Date.now();
        console.error(`[InMemoryQueueBroker] Job ${job.id} in '${queueName}' exhausted all ${maxAttempts} attempts. Marked as failed.`);

        const removeOnFail = job.opts.removeOnFail;
        if (removeOnFail !== true) {
          state.failed.push(job);
          const maxFailed = typeof removeOnFail === 'object' && removeOnFail.count ? removeOnFail.count : 5000;
          if (state.failed.length > maxFailed) {
            state.failed.splice(0, state.failed.length - maxFailed);
          }
        }

        worker.emit('failed', job, err);
      }
    } finally {
      // Trigger dispatch for next waiting item
      this.dispatch(queueName);
    }
  }

  public getJobCounts(queueName: string): Record<string, number> {
    const state = this.queues.get(queueName);
    if (!state) {
      return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    }
    return {
      waiting: state.waiting.length,
      active: state.active.size,
      completed: state.completed.length,
      failed: state.failed.length,
      delayed: state.delayed.size,
    };
  }

  public getFailedJobs(queueName: string): InMemoryJob[] {
    const state = this.queues.get(queueName);
    return state ? [...state.failed] : [];
  }

  public clean(queueName: string, type: 'completed' | 'failed', limit: number = 1000): InMemoryJob[] {
    const state = this.queues.get(queueName);
    if (!state) return [];

    let cleaned: InMemoryJob[] = [];
    if (type === 'completed') {
      cleaned = state.completed.slice(0, limit);
      state.completed = state.completed.slice(limit);
    } else if (type === 'failed') {
      cleaned = state.failed.slice(0, limit);
      state.failed = state.failed.slice(limit);
    }
    return cleaned;
  }

  public closeQueue(queueName: string): void {
    const state = this.queues.get(queueName);
    if (!state) return;

    for (const [, { timer }] of state.delayed.entries()) {
      clearTimeout(timer);
    }
    state.delayed.clear();
    state.waiting = [];
    state.active.clear();
  }

  public clearAll(): void {
    for (const [name] of this.queues.entries()) {
      this.closeQueue(name);
    }
    this.queues.clear();
  }
}
