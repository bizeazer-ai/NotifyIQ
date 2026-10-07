import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QueueService, QueueName, UnifiedWorker } from '../queue.service.js';
import { ErrorRetryLog, ErrorRetryLogDocument } from '../../database/schemas/error-retry-log.schema.js';
import { Workspace, WorkspaceDocument } from '../../database/schemas/workspace.schema.js';
import { Message, MessageDocument } from '../../database/schemas/message.schema.js';
import { env } from '@notifyiq/config';

@Injectable()
export class ErrorRetryWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ErrorRetryWorker.name);
  private worker: UnifiedWorker;

  constructor(
    private readonly queueService: QueueService,
    @InjectModel(ErrorRetryLog.name) private readonly errorRetryLogModel: Model<ErrorRetryLogDocument>,
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
  ) {}

  onModuleInit() {
    this.worker = this.queueService.createWorker(
      QueueName.ERROR_RETRY,
      async (job: any) => {
        const { errorRetryLogId } = job.data;
        if (!errorRetryLogId) return;

        this.logger.log(`[ErrorRetryWorker] Processing retry job for log: ${errorRetryLogId}`);
        const log = await this.errorRetryLogModel.findById(errorRetryLogId);
        if (!log || log.status === 'resolved' || log.status === 'failed') {
          return;
        }

        log.attemptCount += 1;
        log.status = 'retrying';
        await log.save();

        try {
          let { phoneNumberId, to, type, body, template } = log.payload;
          if (!phoneNumberId || phoneNumberId === '1084973887457304') {
            phoneNumberId = '1379849195205126';
          }
          const workspace = await this.workspaceModel.findById(log.workspaceId);
          if (!workspace) {
            throw new Error(`Workspace ${log.workspaceId} not found`);
          }

          const token = env.META_ACCESS_TOKEN;
          const metaUrl = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

          const requestBody: any = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to.replace('+', ''),
            type,
          };
          if (type === 'text') {
            requestBody.text = { body };
          } else if (type === 'template') {
            requestBody.template = template;
          }

          const response = await fetch(metaUrl, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          const data = (await response.json()) as any;

          if (!response.ok || !data.messages?.[0]?.id) {
            const errMsg = data.error?.message || `Meta API HTTP ${response.status}`;
            throw new Error(errMsg);
          }

          const waMessageId = data.messages[0].id;
          log.status = 'resolved';
          log.lastError = null;
          await log.save();

          if (log.messageId) {
            await this.messageModel.findByIdAndUpdate(log.messageId, {
              waMessageId,
              status: 'sent',
            });
          }

          this.logger.log(
            `[ErrorRetryWorker] Successfully dispatched retry for message ${log.messageId || ''} on attempt ${log.attemptCount}`,
          );
          return { success: true, waMessageId };
        } catch (err: any) {
          this.logger.warn(
            `[ErrorRetryWorker] Attempt ${log.attemptCount}/${log.maxAttempts} failed: ${err.message}`,
          );
          log.lastError = err.message;

          if (log.attemptCount >= log.maxAttempts) {
            log.status = 'failed';
            await log.save();
            if (log.messageId) {
              await this.messageModel.findByIdAndUpdate(log.messageId, { status: 'failed' });
            }
            this.logger.error(
              `[ErrorRetryWorker] Max attempts reached for retry ${log._id}. Marked failed.`,
            );
          } else {
            // Exponential backoff tiers: 1m, 5m, 15m, 60m
            const backoffMinutes = [1, 5, 15, 60][log.attemptCount - 1] || 60;
            const delayMs = backoffMinutes * 60 * 1000;
            log.status = 'pending';
            log.nextRetryAt = new Date(Date.now() + delayMs);
            await log.save();

            await this.queueService.addJob(
              QueueName.ERROR_RETRY,
              'retry-failed-meta-call',
              { errorRetryLogId: log._id.toString() },
              undefined,
              { delay: delayMs },
            );
          }
          throw err;
        }
      },
      {
        concurrency: 5,
      },
    );

    this.worker.on('completed', (job: any) => {
      this.logger.log(`[ErrorRetryWorker] Retry job completed: ${job.id}`);
    });

    this.worker.on('failed', (job: any, err: any) => {
      this.logger.warn(`[ErrorRetryWorker] Retry job failed: ${job?.id} - ${err?.message}`);
    });
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
      this.logger.log('[ErrorRetryWorker] Closed worker');
    }
  }
}
