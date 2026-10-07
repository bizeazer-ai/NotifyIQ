import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WorkspaceDocument } from '../../../database/schemas/workspace.schema.js';
import { Contact, ContactDocument } from '../../../database/schemas/contact.schema.js';
import { Conversation, ConversationDocument } from '../../../database/schemas/conversation.schema.js';
import { Message, MessageDocument } from '../../../database/schemas/message.schema.js';
import { SocketGateway } from '../../../socket/socket.gateway.js';
import { QueueService, QueueName } from '../../queue.service.js';
import { OutboundWebhookDispatcher } from '../../../outbound-webhooks/outbound-webhook.dispatcher.js';
import { SentimentService } from '../../../ai/sentiment.service.js';
import { FlowExecutionEngine } from '../../../flows/flow-execution.engine.js';
import { MessagesService } from '../../../messages/messages.service.js';
import { RagService } from '../../../ai/rag.service.js';
import { LeadExtractionService } from '../../../contacts/lead-extraction.service.js';

interface MessageDebounceBuffer {
  workspace: WorkspaceDocument;
  conversation: ConversationDocument;
  contact: ContactDocument;
  messages: string[];
  timer: NodeJS.Timeout;
}

/**
 * InboundMessageListener
 *
 * Handles the `messages` array from a WhatsApp webhook change.value payload.
 * Responsible for:
 *   1. Upsert Contact → Conversation → Message (MongoDB)
 *   2. Emit real-time socket event (message.received)
 *   3. Dispatch outbound webhook: message.inbound
 *   4. Queue voice transcription if audio (AI)
 *   5. Debounce & aggregate rapid messages then:
 *      a. Run sentiment analysis → dispatch: sentiment.analyzed
 *      b. Run flow engine → dispatch: flow.executed / human.handover / lead.status_changed
 *      c. Fallback: AI auto-reply → dispatch: ai.replied / human.handover
 */
@Injectable()
export class InboundMessageListener {
  private readonly logger = new Logger(InboundMessageListener.name);
  private readonly debounceBuffers: Map<string, MessageDebounceBuffer> = new Map();
  private readonly DEBOUNCE_MS = 4000;
  private readonly contactReplyTracker: Map<string, { count: number; resetAt: number }> = new Map();
  private readonly SPAM_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_REPLIES_PER_WINDOW = 5;

  constructor(
    @InjectModel(Contact.name) private readonly contactModel: Model<ContactDocument>,
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
    private readonly socketGateway: SocketGateway,
    private readonly queueService: QueueService,
    private readonly dispatcher: OutboundWebhookDispatcher,
    private readonly sentimentService: SentimentService,
    private readonly flowExecutionEngine: FlowExecutionEngine,
    private readonly messagesService: MessagesService,
    private readonly ragService: RagService,
    private readonly leadExtractionService: LeadExtractionService,
  ) {}

  /**
   * Handle the messages array from a WhatsApp webhook change value.
   * Called by WebhookWorker for each workspace-matched change.
   */
  async handle(val: any, workspace: WorkspaceDocument): Promise<void> {
    if (!val.messages || val.messages.length === 0) return;

    const phoneNumberId = val.metadata?.phone_number_id;
    const profile = val.contacts?.[0]?.profile;
    const contactName = profile?.name || 'WhatsApp User';

    for (const msg of val.messages) {
      await this.processMessage(msg, workspace, phoneNumberId, contactName);
    }
  }

  private async processMessage(
    msg: any,
    workspace: WorkspaceDocument,
    phoneNumberId: string,
    contactName: string,
  ): Promise<void> {
    const rawPhone = msg.from;
    const phone = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`;
    const workspaceId = workspace._id.toString();

    // ── 1. Upsert Contact ────────────────────────────────────────────
    let contact = await this.contactModel.findOne({ workspaceId, phone });
    if (!contact) {
      contact = await this.contactModel.create({
        workspaceId,
        phone,
        name: contactName,
        consentGiven: true,
      });
    }

    if (contact.deletionRequestedAt) {
      this.logger.log(`[InboundMessage] Contact ${phone} requested deletion. Skipping.`);
      return;
    }

    // ── 2. Upsert Conversation ───────────────────────────────────────
    let conversation = await this.conversationModel.findOne({
      workspaceId,
      contactId: contact._id.toString(),
      phoneNumberId,
    });

    const now = new Date();
    const windowExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    if (!conversation) {
      conversation = await this.conversationModel.create({
        workspaceId,
        contactId: contact._id.toString(),
        phoneNumberId,
        lastMessageAt: now,
        lastInboundAt: now,
        windowExpiresAt,
        sentiment: 'neutral',
        status: 'open',
      });
    } else {
      conversation.lastMessageAt = now;
      conversation.lastInboundAt = now;
      conversation.windowExpiresAt = windowExpiresAt;
      await conversation.save();
    }

    // ── 3. Upsert Message (idempotent) ───────────────────────────────
    let messageRecord = await this.messageModel.findOne({ waMessageId: msg.id });
    if (messageRecord) return; // Already processed (duplicate delivery)

    let messageBody: string | null = null;
    if (msg.type === 'text') {
      messageBody = msg.text?.body || '';
    } else if (msg.type === 'interactive') {
      messageBody = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '[Interactive Message]';
    } else {
      messageBody = `[Media: ${msg.type}]`;
    }

    const createdMsg = await this.messageModel.create({
      workspaceId,
      conversationId: conversation._id.toString(),
      waMessageId: msg.id,
      direction: 'inbound',
      type: msg.type,
      status: 'delivered',
      body: messageBody,
    });

    messageRecord = createdMsg;

    // ── 4. Real-time socket emit ─────────────────────────────────────
    this.socketGateway.emitToWorkspace(workspaceId, 'message.received', {
      message: createdMsg,
      contact,
      conversation,
    });

    // ── 5. Dispatch outbound webhook: message.inbound ────────────────
    this.dispatcher.dispatchEvent(workspaceId, 'message.inbound', {
      message: {
        id: createdMsg._id.toString(),
        waMessageId: msg.id,
        type: msg.type,
        body: messageBody,
        direction: 'inbound',
        status: 'delivered',
        createdAt: (createdMsg as any).createdAt,
      },
      contact: {
        id: contact._id.toString(),
        phone: contact.phone,
        name: contact.name,
      },
      conversation: {
        id: conversation._id.toString(),
        sentiment: conversation.sentiment,
      },
    }).catch((err) => this.logger.error(`[InboundMessage] Dispatcher error: ${err.message}`));

    // ── 6. Voice transcription queue ────────────────────────────────
    if (workspace.aiSettings?.voiceTranscriptionEnabled && msg.type === 'audio') {
      await this.queueService.addJob(QueueName.AUDIO_PROCESSOR, 'transcribe-voice', {
        messageId: createdMsg._id.toString(),
        mediaId: msg.audio?.id,
      });
    }

    // ── 7. Debounced flow / auto-reply ──────────────────────────────
    if (messageBody) {
      this.bufferAndExecute(workspace, conversation, contact, messageBody);
    }
  }

  /**
   * Buffers rapid messages per conversation and triggers flow/sentiment
   * ONCE for the aggregated text after the debounce window.
   */
  private bufferAndExecute(
    workspace: WorkspaceDocument,
    conversation: ConversationDocument,
    contact: ContactDocument,
    messageBody: string,
  ): void {
    const convId = conversation._id.toString();
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
      const current = this.debounceBuffers.get(convId);
      this.debounceBuffers.delete(convId);
      if (!current || current.messages.length === 0) return;

      const combinedBody = current.messages.join('\n');
      const workspaceId = workspace._id.toString();
      this.logger.log(`[InboundMessage] Debounce fired for ${convId}: "${combinedBody.substring(0, 80)}"`);

      try {
        // ── A. Sentiment Analysis ──────────────────────────────────
        let sentiment: string = conversation.sentiment || 'neutral';
        if (workspace.aiSettings?.sentimentAnalysisEnabled !== false) {
          sentiment = await this.sentimentService.analyzeConversationSentiment(
            workspaceId,
            convId,
            combinedBody,
          );
          this.logger.log(`[InboundMessage] Sentiment for ${convId}: ${sentiment}`);

          // Dispatch: sentiment.analyzed
          this.dispatcher.dispatchEvent(workspaceId, 'sentiment.analyzed', {
            conversationId: convId,
            contactId: contact._id.toString(),
            sentiment,
            analyzedText: combinedBody.substring(0, 200),
          }).catch((err) => this.logger.error(`[InboundMessage] Dispatcher (sentiment) error: ${err.message}`));
        }

        // ── B. Flow Engine ─────────────────────────────────────────
        const flowResult = await this.flowExecutionEngine.executeFlowForInboundMessage(
          workspaceId,
          conversation,
          contact,
          combinedBody,
          sentiment,
        );

        if (flowResult.executed) {
          this.logger.log(`[InboundMessage] Flow "${flowResult.flowName}" executed. Actions: ${flowResult.actionsTaken?.join(', ')}`);

          // Dispatch: flow.executed
          this.dispatcher.dispatchEvent(workspaceId, 'flow.executed', {
            flowId: flowResult.flowId,
            flowName: flowResult.flowName,
            actionsTaken: flowResult.actionsTaken,
            contact: {
              id: contact._id.toString(),
              phone: contact.phone,
              name: contact.name,
            },
            conversationId: convId,
          }).catch((err) => this.logger.error(`[InboundMessage] Dispatcher (flow) error: ${err.message}`));

          // Dispatch: human.handover if flow included human_handoff action
          const hadHumanHandoff = flowResult.actionsTaken?.some((a) => a.startsWith('human_handoff'));
          if (hadHumanHandoff) {
            this.dispatcher.dispatchEvent(workspaceId, 'human.handover', {
              reason: 'flow_escalation',
              triggeredBy: 'flow_engine',
              flowId: flowResult.flowId,
              flowName: flowResult.flowName,
              contact: { id: contact._id.toString(), phone: contact.phone, name: contact.name },
              conversation: { id: convId, sentiment: conversation.sentiment },
            }).catch((err) => this.logger.error(`[InboundMessage] Dispatcher (human.handover) error: ${err.message}`));
          }
        } else if (workspace.autoReplySettings?.enabled) {
          // ── C. AI Auto-reply fallback ──────────────────────────
          await this.runAutoReply(workspace, conversation, contact, combinedBody);
        }
      } catch (err: any) {
        this.logger.error(`[InboundMessage] Debounce execution error for ${convId}: ${err.message}`);
      }
    }, this.DEBOUNCE_MS);
  }

  async runAutoReply(
    workspace: WorkspaceDocument,
    conversation: ConversationDocument,
    contact: ContactDocument,
    userQuery: string,
  ): Promise<void> {
    const settings = workspace.autoReplySettings;
    if (!settings || !settings.enabled) return;

    const workspaceId = workspace._id.toString();

    if ((conversation as any).isHumanTakeover) {
      this.logger.log(`[InboundMessage] Human takeover active for ${conversation._id}. Skipping auto-reply.`);
      return;
    }

    // 1. Anti-Spam Rate Limiter (Loop Prevention)
    const now = Date.now();
    const contactKey = `${workspaceId}:${contact.phone}`;
    let tracker = this.contactReplyTracker.get(contactKey);

    if (!tracker || now > tracker.resetAt) {
      tracker = { count: 0, resetAt: now + this.SPAM_WINDOW_MS };
      this.contactReplyTracker.set(contactKey, tracker);
    }

    if (tracker.count >= this.MAX_REPLIES_PER_WINDOW) {
      this.logger.warn(`[InboundMessage] Anti-spam triggered for ${contact.phone} (>5 replies in 5m). Halting AI auto-reply.`);
      conversation.isHumanTakeover = true;
      await conversation.save();

      this.socketGateway.emitToWorkspace(workspaceId, 'escalation.alert', {
        messageId: conversation._id.toString(),
        conversationId: conversation._id.toString(),
        sentiment: 'urgent',
        body: `Anti-spam loop protection: Contact ${contact.phone} received 5 consecutive AI replies within 5 minutes. Automated replies halted.`,
        timestamp: new Date(),
      });

      this.dispatcher.dispatchEvent(workspaceId, 'human.handover', {
        reason: 'anti_spam_limit_exceeded',
        triggeredBy: 'auto_reply_limiter',
        contact: { id: contact._id.toString(), phone: contact.phone, name: contact.name },
        conversation: { id: conversation._id.toString(), sentiment: 'urgent' },
      }).catch((err) => this.logger.error(`[InboundMessage] Dispatcher error: ${err.message}`));

      return;
    }

    // 2. Business Operating Hours & Out-of-Hours Check
    const operatingHours = settings.operatingHours;
    if (operatingHours && operatingHours.enabled) {
      try {
        const tz = operatingHours.timezone || 'Asia/Kolkata';
        const nowInTz = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
        const currentDay = nowInTz.getDay();
        const currentHour = nowInTz.getHours();
        const currentMinute = nowInTz.getMinutes();
        const currentTimeMinutes = currentHour * 60 + currentMinute;

        const [startH, startM] = (operatingHours.startTime || '09:00').split(':').map(Number);
        const [endH, endM] = (operatingHours.endTime || '18:00').split(':').map(Number);
        const startTotal = (startH || 9) * 60 + (startM || 0);
        const endTotal = (endH || 18) * 60 + (endM || 0);

        const isWorkDay = Array.isArray(operatingHours.workDays) ? operatingHours.workDays.includes(currentDay) : true;
        const isWithinHours = isWorkDay && currentTimeMinutes >= startTotal && currentTimeMinutes < endTotal;

        if (settings.outOfHoursOnly && isWithinHours) {
          this.logger.log(`[InboundMessage] Business is currently OPEN (within operating hours). Skipping auto-reply for human staff.`);
          return;
        }

        if (!isWithinHours && settings.outOfHoursMessage && settings.outOfHoursOnly) {
          await this.messagesService.sendTextMessage(workspaceId, {
            to: contact.phone,
            body: settings.outOfHoursMessage,
          });
          tracker.count++;
          return;
        }
      } catch (err: any) {
        this.logger.warn(`[InboundMessage] Operating hours check error: ${err.message}`);
      }
    }

    const ragResult = await this.ragService.queryKnowledgeBase(
      workspaceId,
      userQuery,
      conversation._id.toString(),
    );
    const threshold = settings.confidenceThreshold || 0.70;

    // Automatically parse & persist extracted lead attributes if detected
    if (ragResult.userDetails) {
      this.leadExtractionService
        .processExtractedLead(
          workspaceId,
          contact._id.toString(),
          contact.phone,
          ragResult.userDetails,
          userQuery,
          ragResult.confidenceScore,
        )
        .catch((err) =>
          this.logger.warn(`[InboundMessage] Lead extraction execution error: ${err.message}`),
        );
    }

    if (ragResult.answer && (ragResult.confidenceScore === undefined || ragResult.confidenceScore >= threshold)) {
      tracker.count++;
      this.logger.log(`[InboundMessage] AI auto-reply triggered. Confidence: ${ragResult.confidenceScore}`);

      await this.messagesService.sendTextMessage(workspaceId, {
        to: contact.phone,
        body: ragResult.answer,
      });

      // Dispatch: ai.replied
      this.dispatcher.dispatchEvent(workspaceId, 'ai.replied', {
        replyBody: ragResult.answer,
        confidenceScore: ragResult.confidenceScore,
        threshold,
        query: userQuery,
        contact: { id: contact._id.toString(), phone: contact.phone, name: contact.name },
        conversation: { id: conversation._id.toString(), sentiment: conversation.sentiment },
      }).catch((err) => this.logger.error(`[InboundMessage] Dispatcher (ai.replied) error: ${err.message}`));

    } else if (settings.fallbackToHuman) {
      this.logger.warn(`[InboundMessage] AI confidence ${ragResult.confidenceScore} < ${threshold}. Escalating to human.`);

      this.socketGateway.emitToWorkspace(workspaceId, 'escalation.alert', {
        messageId: conversation._id.toString(),
        conversationId: conversation._id.toString(),
        sentiment: 'urgent',
        body: `Low confidence AI match (${((ragResult.confidenceScore || 0) * 100).toFixed(0)}%). Live agent required for: "${userQuery}"`,
        timestamp: new Date(),
      });

      // Dispatch: human.handover
      this.dispatcher.dispatchEvent(workspaceId, 'human.handover', {
        reason: 'low_confidence',
        triggeredBy: 'auto_reply',
        confidenceScore: ragResult.confidenceScore,
        threshold,
        query: userQuery,
        contact: { id: contact._id.toString(), phone: contact.phone, name: contact.name },
        conversation: { id: conversation._id.toString(), sentiment: 'urgent' },
      }).catch((err) => this.logger.error(`[InboundMessage] Dispatcher (human.handover) error: ${err.message}`));
    }
  }

  /**
   * Alias for backwards compatibility with tests and callers
   */
  async evaluateAndExecuteAutoReply(
    workspace: WorkspaceDocument,
    conversation: ConversationDocument,
    contact: ContactDocument,
    userQuery: string,
  ): Promise<void> {
    return this.runAutoReply(workspace, conversation, contact, userQuery);
  }
}
