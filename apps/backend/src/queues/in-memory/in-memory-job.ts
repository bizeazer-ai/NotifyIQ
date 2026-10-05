import { randomUUID } from 'crypto';

export interface InMemoryJobOptions {
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  delay?: number;
  jobId?: string;
  removeOnComplete?: boolean | number | { count: number };
  removeOnFail?: boolean | number | { count: number };
  [key: string]: any;
}

export class InMemoryJob<T = any> {
  public readonly id: string;
  public readonly name: string;
  public readonly data: T;
  public readonly opts: InMemoryJobOptions;
  public attemptsMade: number = 0;
  public readonly timestamp: number;
  public processedOn?: number;
  public finishedOn?: number;
  public failedReason?: string;
  public stacktrace: string[] = [];
  public returnvalue?: any;
  public progress: number | object = 0;

  private onProgressCallback?: (progress: number | object) => void;
  private onRetryCallback?: () => Promise<void>;

  constructor(
    name: string,
    data: T,
    opts: InMemoryJobOptions = {},
    customId?: string,
  ) {
    this.name = name;
    this.data = data;
    this.opts = opts;
    this.id = customId || opts.jobId || randomUUID();
    this.timestamp = Date.now();
  }

  public setProgressHandler(handler: (progress: number | object) => void): void {
    this.onProgressCallback = handler;
  }

  public setRetryHandler(handler: () => Promise<void>): void {
    this.onRetryCallback = handler;
  }

  public async updateProgress(progress: number | object): Promise<void> {
    this.progress = progress;
    if (this.onProgressCallback) {
      this.onProgressCallback(progress);
    }
  }

  public async log(row: string): Promise<void> {
    this.stacktrace.push(`[${new Date().toISOString()}] ${row}`);
  }

  public async retry(): Promise<void> {
    if (this.onRetryCallback) {
      await this.onRetryCallback();
    }
  }
}
