import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QueueService, QueueName, UnifiedWorker } from '../queue.service.js';
import crypto from 'crypto';
import { RedisService } from '../../common/services/redis.service.js';
import { SocketGateway } from '../../socket/socket.gateway.js';
import { RagService } from '../../ai/rag.service.js';
import { FlowExecutionEngine } from '../../flows/flow-execution.engine.js';
import { Workspace, WorkspaceDocument } from '../../database/schemas/workspace.schema.js';
import { Contact, ContactDocument } from '../../database/schemas/contact.schema.js';
import { Conversation, ConversationDocument } from '../../database/schemas/conversation.schema.js';
import { Message, MessageDocument } from '../../database/schemas/message.schema.js';
import { decrypt } from '../../lib/utils/encryption.js';
import { MessagesService } from '../../messages/messages.service.js';
import { SentimentService } from '../../ai/sentiment.service.js';

interface MessageDebounceBuffer {
  workspace: WorkspaceDocument;
  conversation: ConversationDocument;
  contact: ContactDocument;
  messages: string[];
  timer: NodeJS.Timeout;
}

@Injectable()
export class WebhookWorker implements OnModuleInit, OnModuleDestroy {
  private worker: UnifiedWorker;
  private debounceBuffers: Map<string, MessageDebounceBuffer> = new Map();

  constructor(
    private readonly redisService: RedisService,
    private readonly queueService: QueueService,
    private readonly socketGateway: SocketGateway,
    private readonly ragService: RagService,
    private readonly flowExecutionEngine: FlowExecutionEngine,
    private readonly messageService: MessagesService,
    private readonly sentimentService: SentimentService,
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(Contact.name) private readonly contactModel: Model<ContactDocument>,
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
  ) { }

  onModuleInit() {
    this.worker = this.queueService.createWorker(
      QueueName.WEBHOOK_PROCESSOR,
      async (job: any) => {
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

                  if (workspace.aiSettings?.voiceTranscriptionEnabled && msg.type === 'audio') {
                    await this.queueService.addJob(
                      QueueName.AUDIO_PROCESSOR,
                      'transcribe-voice',
                      { messageId: createdMsg._id.toString(), mediaId: msg.audio?.id }
                    );
                  }

                  // C. Evaluate Active Automation Flow Engine with Debouncing & History-Aware Sentiment Analysis
                  if (messageBody) {
                    this.bufferAndExecuteFlowOrAutoReply(workspace, conversation, contact, messageBody);
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
      { concurrency: 20 },
    );

    this.worker.on('completed', (job) => {
      console.log(`[WebhookWorker] Raw payload processing completed for job: ${job.id}`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`[WebhookWorker] Processing failed for job ${job?.id}:`, err.message);
    });
  }

  /**
   * Buffers rapid incoming WhatsApp messages per conversation and executes flow/sentiment analysis ONCE for aggregated text.
   */
  private bufferAndExecuteFlowOrAutoReply(
    workspace: WorkspaceDocument,
    conversation: ConversationDocument,
    contact: ContactDocument,
    messageBody: string,
  ) {
    const convId = conversation._id.toString();
    const DEBOUNCE_MS = 2500; // 2.5s window to collect spam / rapid messages

    let buffer = this.debounceBuffers.get(convId);
    if (buffer) {
      clearTimeout(buffer.timer);
      buffer.messages.push(messageBody);
    } else {
      buffer = {
        workspace,
        conversation,
        contact,
        messages: [messageBody],
        timer: setTimeout(() => {}, 0),
      };
      this.debounceBuffers.set(convId, buffer);
    }

    buffer.timer = setTimeout(async () => {
      const currentBuffer = this.debounceBuffers.get(convId);
      this.debounceBuffers.delete(convId);

      if (!currentBuffer || currentBuffer.messages.length === 0) return;

      const combinedBody = currentBuffer.messages.join('\n');
      console.log(`[WebhookWorker] Aggregated ${currentBuffer.messages.length} messages for conversation ${convId}:\n"${combinedBody}"`);

      try {
        // 1. Analyze sentiment considering chat history + current combined message (only if enabled for workspace)
        let sentiment: string = conversation.sentiment || 'neutral';
        if (workspace.aiSettings?.sentimentAnalysisEnabled !== false) {
          sentiment = await this.sentimentService.analyzeConversationSentiment(
            workspace._id.toString(),
            convId,
            combinedBody,
          );
          console.log(`[WebhookWorker] Computed history-aware sentiment for ${convId}: ${sentiment}`);
        }

        // 2. Execute active Flow Engine

        const flowResult = await this.flowExecutionEngine.executeFlowForInboundMessage(
          workspace._id.toString(),
          conversation,
          contact,
          combinedBody,
          sentiment,
        );

        if (flowResult.executed) {
          console.log(
            `[WebhookWorker] Active Flow "${flowResult.flowName}" (${flowResult.flowId}) executed. Actions:`,
            flowResult.actionsTaken,
          );
        } else if (workspace.autoReplySettings?.enabled) {
          // 3. Fallback to AI Auto-Reply with Knowledge Base + Conversation History
          await this.evaluateAndExecuteAutoReply(workspace, conversation, contact, combinedBody);
        }
      } catch (err: any) {
        console.error(`[WebhookWorker] Error executing debounced flow engine:`, err.message);
      }
    }, DEBOUNCE_MS);
  }

  private async evaluateAndExecuteAutoReply(
    workspace: WorkspaceDocument,
    conversation: ConversationDocument,
    contact: ContactDocument,
    userQuery: string,
  ) {
    const settings = workspace.autoReplySettings;
    if (!settings || !settings.enabled) return;

    // Respect Human Takeover flag if present
    if ((conversation as any).isHumanTakeover) {
      console.log(`[WebhookWorker] Human takeover active for conversation ${conversation._id}. Skipping auto-reply.`);
      return;
    }

    // Pass conversation._id to queryKnowledgeBase for chat history context injection
    const ragResult = await this.ragService.queryKnowledgeBase(
      workspace._id.toString(),
      userQuery,
      conversation._id.toString(),
    );
    const threshold = settings.confidenceThreshold || 0.70;
    console.log('[Threshold rag result]', ragResult);

    if (ragResult.answer && (ragResult.confidenceScore === undefined || ragResult.confidenceScore >= threshold)) {
      console.log(`[WebhookWorker] Auto-reply triggered! Confidence: ${ragResult.confidenceScore} >= ${threshold}`);


      // sendTextMessage creates the DB record with authentic waMessageId and emits socket message.sent
      await this.messageService.sendTextMessage(workspace._id.toString(), { to: contact.phone, body: ragResult.answer });
    } else if (settings.fallbackToHuman) {
      console.warn(`[WebhookWorker] Auto-reply confidence ${ragResult.confidenceScore} < ${threshold}. Escalating to human agent.`);

      this.socketGateway.emitToWorkspace(workspace._id.toString(), 'escalation.alert', {
        messageId: conversation._id.toString(),
        conversationId: conversation._id.toString(),
        sentiment: 'urgent',
        body: `Low confidence AI match (${((ragResult.confidenceScore || 0) * 100).toFixed(0)}%). Live agent required for: "${userQuery}"`,
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
