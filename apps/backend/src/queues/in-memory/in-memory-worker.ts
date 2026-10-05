import { EventEmitter } from 'events';
import { InMemoryJob } from './in-memory-job.js';
import { InMemoryQueueBroker, InMemoryWorkerRef } from './in-memory-bus.js';

export interface InMemoryWorkerOptions {
  concurrency?: number;
  [key: string]: any;
}

export type InMemoryProcessor<T = any, R = any> = (job: InMemoryJob<T>) => Promise<R>;

export class InMemoryWorker<T = any> extends EventEmitter implements InMemoryWorkerRef {
  public readonly name: string;
  public readonly concurrency: number;
  public readonly processor: (job: InMemoryJob<T>) => Promise<any>;
  public isPaused: boolean = false;
  public isClosed: boolean = false;
  private broker: InMemoryQueueBroker;

  constructor(
    name: string,
    processor: InMemoryProcessor<T>,
    options: InMemoryWorkerOptions = {},
  ) {
    super();
    this.name = name;
    this.processor = processor;
    this.concurrency = options.concurrency && options.concurrency > 0 ? options.concurrency : 1;
    this.broker = InMemoryQueueBroker.getInstance();

    this.broker.registerWorker(this.name, this);
  }

  public async pause(): Promise<void> {
    this.isPaused = true;
    this.emit('paused');
  }

  public async resume(): Promise<void> {
    this.isPaused = false;
    this.emit('resumed');
    this.broker.dispatch(this.name);
  }

  public async close(): Promise<void> {
    this.isClosed = true;
    this.broker.unregisterWorker(this.name, this);
    this.removeAllListeners();
  }
}
