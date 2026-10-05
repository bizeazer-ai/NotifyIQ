import { InMemoryQueue } from './in-memory-queue.js';
import { InMemoryWorker } from './in-memory-worker.js';
import { InMemoryQueueBroker } from './in-memory-bus.js';

describe('Pure TypeScript In-Memory Queue & Worker Fallback Engine', () => {
  beforeEach(() => {
    InMemoryQueueBroker.getInstance().clearAll();
  });

  afterEach(() => {
    InMemoryQueueBroker.getInstance().clearAll();
  });

  it('should successfully enqueue, process, and complete a job in memory', async () => {
    const queueName = 'test-complete-queue';
    const queue = new InMemoryQueue<{ text: string }>(queueName);

    const completedPromise = new Promise<{ job: any; result: any }>((resolve) => {
      const worker = new InMemoryWorker(queueName, async (job) => {
        expect(job.data.text).toBe('Hello In-Memory Redis Fallback');
        return { success: true, processedAt: Date.now() };
      });

      worker.on('completed', (job, result) => {
        resolve({ job, result });
      });
    });

    const job = await queue.add('test-job', { text: 'Hello In-Memory Redis Fallback' });
    expect(job.id).toBeDefined();

    const { job: completedJob, result } = await completedPromise;
    expect(completedJob.id).toBe(job.id);
    expect(result.success).toBe(true);

    const counts = await queue.getJobCounts();
    expect(counts.completed).toBe(1);
    expect(counts.waiting).toBe(0);
    expect(counts.failed).toBe(0);
  });

  it('should handle retries and exponential backoff on failure before completing or exhausting', async () => {
    const queueName = 'test-retry-queue';
    const queue = new InMemoryQueue(queueName, {
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'fixed', delay: 50 },
      },
    });

    let attemptCount = 0;

    const failedPromise = new Promise<{ job: any; error: any }>((resolve) => {
      const worker = new InMemoryWorker(queueName, async () => {
        attemptCount++;
        throw new Error(`Fail attempt ${attemptCount}`);
      });

      worker.on('failed', (job, error) => {
        resolve({ job, error });
      });
    });

    await queue.add('failing-job', { data: 'test' });

    const { job: failedJob, error } = await failedPromise;
    expect(attemptCount).toBe(2);
    expect(failedJob.attemptsMade).toBe(2);
    expect(error.message).toBe('Fail attempt 2');

    const counts = await queue.getJobCounts();
    expect(counts.failed).toBe(1);
    expect(counts.active).toBe(0);
  });

  it('should respect concurrency limits', async () => {
    const queueName = 'test-concurrency-queue';
    const queue = new InMemoryQueue(queueName);

    let activeCount = 0;
    let maxObservedConcurrency = 0;
    const totalJobs = 5;
    let finishedCount = 0;

    const allFinished = new Promise<void>((resolve) => {
      const worker = new InMemoryWorker(
        queueName,
        async () => {
          activeCount++;
          if (activeCount > maxObservedConcurrency) {
            maxObservedConcurrency = activeCount;
          }
          await new Promise((r) => setTimeout(r, 60));
          activeCount--;
          return true;
        },
        { concurrency: 2 }
      );

      worker.on('completed', () => {
        finishedCount++;
        if (finishedCount === totalJobs) {
          resolve();
        }
      });
    });

    for (let i = 0; i < totalJobs; i++) {
      await queue.add(`job-${i}`, { index: i });
    }

    await allFinished;
    expect(maxObservedConcurrency).toBeLessThanOrEqual(2);
    expect(finishedCount).toBe(totalJobs);
  });

  it('should clean completed and failed jobs', async () => {
    const queueName = 'test-clean-queue';
    const queue = new InMemoryQueue(queueName);

    const worker = new InMemoryWorker(queueName, async () => {
      return 'done';
    });

    const job = await queue.add('cleanable-job', {});
    await new Promise((r) => worker.on('completed', r));

    let counts = await queue.getJobCounts();
    expect(counts.completed).toBe(1);

    const cleaned = await queue.clean(0, 10, 'completed');
    expect(cleaned).toContain(job.id);

    counts = await queue.getJobCounts();
    expect(counts.completed).toBe(0);
  });
});
