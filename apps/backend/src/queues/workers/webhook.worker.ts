import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Worker, Job } from 'bullmq';
import crypto from 'crypto';
import { RedisService } from '../../common/services/redis.service.js';
import { QueueService, QueueName } from '../queue.service.js';
import { SocketGateway } from '../../socket/socket.gateway.js';
import { RagService } from '../../ai/rag.service.js';
import { FlowExecutionEngine } from '../../flows/flow-execution.engine.js';
import { Workspace, WorkspaceDocument } from '../../database/schemas/workspace.schema.js';
import { Contact, ContactDocument } from '../../database/schemas/contact.schema.js';
import { Conversation, ConversationDocument } from '../../database/schemas/conversation.schema.js';
import { Message, MessageDocument } from '../../database/schemas/message.schema.js';
import { decrypt } from '../../lib/utils/encryption.js';

@Injectable()
export class WebhookWorker implements OnModuleInit, OnModuleDestroy {
  private worker: Worker;

  constructor(
    private readonly redisService: RedisService,
    private readonly queueService: QueueService,
    private readonly socketGateway: SocketGateway,
    private readonly ragService: RagService,
    private readonly flowExecutionEngine: FlowExecutionEngine,
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(Contact.name) private readonly contactModel: Model<ContactDocument>,
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
  ) {}


  onModuleInit() {
    const connection = this.redisService.getClient();

    this.worker = new Worker(
      QueueName.WEBHOOK_PROCESSOR,
      async (job: Job) => {
        const payload = job.data;
        console.log(`[WebhookWorker] Processing raw webhook event: ${job.id}`);

        const entries = payload?.entry || [];
        for (const entry of entries) {
          const changes = entry.changes || [];
          for (const change of changes) {
            const val = change.value;
            if (!val || val.messaging_product !== 'whatsapp') continue;

            const metadata = val.metadata;
            if (!metadata) continue;

            const phoneNumberId = metadata.phone_number_id;

            const workspace = await this.workspaceModel.findOne({ 'waba.phoneNumberId': phoneNumberId });
            if (!workspace) {
              console.warn(`[WebhookWorker] Unknown WABA phone number ID: ${phoneNumberId}`);
              continue;
            }

            if (val.messages && val.messages.length > 0) {
              const profile = val.contacts?.[0]?.profile;
              const contactName = profile?.name || 'WhatsApp User';

              for (const msg of val.messages) {
                const rawPhone = msg.from;
                const phone = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`;

                let contact = await this.contactModel.findOne({ workspaceId: workspace._id.toString(), phone });
                if (!contact) {
                  contact = await this.contactModel.create({
                    workspaceId: workspace._id.toString(),
                    phone,
                    name: contactName,
                    consentGiven: true,
                  });
                }

                if (contact.deletionRequestedAt) {
                  console.log(`[WebhookWorker] Contact ${phone} requested deletion. Skipping message upsert.`);
                  continue;
                }

                let conversation = await this.conversationModel.findOne({
                  workspaceId: workspace._id.toString(),
                  contactId: contact._id.toString(),
                  phoneNumberId,
                });

                if (!conversation) {
                  conversation = await this.conversationModel.create({
                    workspaceId: workspace._id.toString(),
                    contactId: contact._id.toString(),
                    phoneNumberId,
                    lastMessageAt: new Date(),
                    sentiment: 'neutral',
                  });
                } else {
                  conversation.lastMessageAt = new Date();
                  await conversation.save();
                }

                let messageRecord = await this.messageModel.findOne({ waMessageId: msg.id });
                if (!messageRecord) {
                  let messageBody: string | null = null;
                  if (msg.type === 'text') {
                    messageBody = msg.text?.body || '';
                  } else if (msg.type === 'interactive') {
                    messageBody = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '[Interactive Message]';
                  } else {
                    messageBody = `[Media: ${msg.type}]`;
                  }

                  const createdMsg = await this.messageModel.create({
                    workspaceId: workspace._id.toString(),
                    conversationId: conversation._id.toString(),
                    waMessageId: msg.id,
                    direction: 'inbound',
                    type: msg.type,
                    status: 'delivered',
                    body: messageBody,
                  });

                  messageRecord = createdMsg;

                  this.socketGateway.emitToWorkspace(workspace._id.toString(), 'message.received', {
                    message: createdMsg,
                    contact,
                    conversation,
                  });

                  if (workspace.aiSettings?.sentimentAnalysisEnabled && msg.type === 'text' && messageBody) {
                    await this.queueService.addJob(
                      QueueName.SENTIMENT_ANALYSIS,
                      'analyze-sentiment',
                      { messageId: createdMsg._id.toString(), text: messageBody }
                    );
                  }

                  if (workspace.aiSettings?.voiceTranscriptionEnabled && msg.type === 'audio') {
                    await this.queueService.addJob(
                      QueueName.AUDIO_PROCESSOR,
                      'transcribe-voice',
                      { messageId: createdMsg._id.toString(), mediaId: msg.audio?.id }
                    );
                  }

                  // C. Evaluate Active Automation Flow Engine (with Auto-Reply Fallback)
                  if (messageBody) {
                    this.flowExecutionEngine
                      .executeFlowForInboundMessage(
                        workspace._id.toString(),
                        conversation,
                        contact,
                        messageBody,
                        conversation.sentiment || 'neutral',
                      )
                      .then((flowResult) => {
                        if (flowResult.executed) {
                          console.log(
                            `[WebhookWorker] Active Flow "${flowResult.flowName}" (${flowResult.flowId}) executed. Actions:`,
                            flowResult.actionsTaken,
                          );
                        } else if (workspace.autoReplySettings?.enabled) {
                          this.evaluateAndExecuteAutoReply(workspace, conversation, contact, messageBody).catch((err) =>
                            console.error('[WebhookWorker] Auto-reply evaluation failed:', err.message),
                          );
                        }
                      })
                      .catch((err) => console.error('[WebhookWorker] Flow execution error:', err.message));
                  }

                }
              }
            }

            if (val.statuses && val.statuses.length > 0) {
              for (const status of val.statuses) {
                const messageRecord = await this.messageModel.findOne({ waMessageId: status.id });
                if (messageRecord) {
                  messageRecord.status = status.status;
                  await messageRecord.save();

                  this.socketGateway.emitToWorkspace(workspace._id.toString(), 'message.status_updated', {
                    messageId: messageRecord._id.toString(),
                    waMessageId: status.id,
                    status: status.status,
                  });
                }
              }
            }

            const forwardUrl = (workspace as any).webhookForwardUrl;
            if (forwardUrl) {
              this.forwardWebhookPayload(forwardUrl, payload, workspace).catch((err) =>
                console.error('[WebhookWorker] Webhook forwarding error:', err.message)
              );
            }
          }
        }

        return { success: true };
      },
      { connection, concurrency: 20 },
    );

    this.worker.on('completed', (job) => {
      console.log(`[WebhookWorker] Raw payload processing completed for job: ${job.id}`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`[WebhookWorker] Processing failed for job ${job?.id}:`, err.message);
    });
  }

  private async evaluateAndExecuteAutoReply(
    workspace: WorkspaceDocument,
    conversation: ConversationDocument,
    contact: ContactDocument,
    userQuery: string,
  ) {
    const settings = workspace.autoReplySettings;
    if (!settings || !settings.enabled) return;

    const ragResult = await this.ragService.queryKnowledgeBase(workspace._id.toString(), userQuery);
    const threshold = settings.confidenceThreshold || 0.70;

    if (ragResult.confidenceScore >= threshold && ragResult.answer) {
      console.log(`[WebhookWorker] Auto-reply triggered! Confidence: ${ragResult.confidenceScore} >= ${threshold}`);

      const autoReplyMsg = await this.messageModel.create({
        workspaceId: workspace._id.toString(),
        conversationId: conversation._id.toString(),
        waMessageId: `auto_${Date.now()}`,
        direction: 'outbound',
        type: 'text',
        status: 'delivered',
        body: ragResult.answer,
      });

      this.socketGateway.emitToWorkspace(workspace._id.toString(), 'message.sent', {
        message: autoReplyMsg,
        conversation,
      });
    } else if (settings.fallbackToHuman) {
      console.warn(`[WebhookWorker] Auto-reply confidence ${ragResult.confidenceScore} < ${threshold}. Escalating to human agent.`);

      this.socketGateway.emitToWorkspace(workspace._id.toString(), 'escalation.alert', {
        messageId: conversation._id.toString(),
        conversationId: conversation._id.toString(),
        sentiment: 'urgent',
        body: `Low confidence AI match (${(ragResult.confidenceScore * 100).toFixed(0)}%). Live agent required for: "${userQuery}"`,
        timestamp: new Date(),
      });
    }
  }

  private async forwardWebhookPayload(url: string, payload: any, workspace: WorkspaceDocument) {
    const wabaSecretEncrypted = workspace.waba?.webhookSecret;
    if (!wabaSecretEncrypted) return;

    try {
      const webhookSecret = decrypt(wabaSecretEncrypted);
      const rawBody = JSON.stringify(payload);
      const signature = 'sha256=' + crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-notifyiq-signature-256': signature,
        },
        body: rawBody,
      });
    } catch (err: any) {
      console.error('[WebhookWorker] Webhook forwarding transmission failed:', err.message);
    }
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
      console.log('[WebhookWorker] Closed connection');
    }
  }
}
