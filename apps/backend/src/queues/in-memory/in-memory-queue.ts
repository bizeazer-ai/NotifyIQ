import { InMemoryJob, InMemoryJobOptions } from './in-memory-job.js';
import { InMemoryQueueBroker } from './in-memory-bus.js';

export interface InMemoryQueueOptions {
  defaultJobOptions?: InMemoryJobOptions;
  [key: string]: any;
}

export class InMemoryQueue<T = any> {
  public readonly name: string;
  public readonly defaultJobOptions: InMemoryJobOptions;
  private broker: InMemoryQueueBroker;
  private isClosed: boolean = false;

  constructor(name: string, options: InMemoryQueueOptions = {}) {
    this.name = name;
    this.defaultJobOptions = options.defaultJobOptions || {};
    this.broker = InMemoryQueueBroker.getInstance();
  }

  public async add(jobName: string, data: T, opts: InMemoryJobOptions = {}): Promise<InMemoryJob<T>> {
    if (this.isClosed) {
      throw new Error(`Cannot add job to closed queue '${this.name}'`);
    }

    const mergedOpts: InMemoryJobOptions = {
      ...this.defaultJobOptions,
      ...opts,
    };

    const job = new InMemoryJob<T>(jobName, data, mergedOpts, opts.jobId);
    await this.broker.enqueue(this.name, job);
    return job;
  }

  public async getJobCounts(..._types: string[]): Promise<Record<string, number>> {
    return this.broker.getJobCounts(this.name);
  }

  public async getWorkers(): Promise<any[]> {
    // Return mock worker list for admin dashboard compatibility
    return [{ id: `in-memory-worker-${this.name}`, name: this.name }];
  }

  public async getFailed(): Promise<InMemoryJob<T>[]> {
    return this.broker.getFailedJobs(this.name) as InMemoryJob<T>[];
  }

  public async clean(_grace: number, limit: number, type: 'completed' | 'failed'): Promise<string[]> {
    const cleaned = this.broker.clean(this.name, type, limit);
    return cleaned.map((j) => j.id);
  }

  public async close(): Promise<void> {
    this.isClosed = true;
    this.broker.closeQueue(this.name);
  }

  public async drain(): Promise<void> {
    this.broker.closeQueue(this.name);
  }
}
