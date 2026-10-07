import { Injectable, BadRequestException, ForbiddenException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import crypto from 'crypto';
import { Workspace, WorkspaceDocument } from '../database/schemas/workspace.schema.js';
import { Contact, ContactDocument } from '../database/schemas/contact.schema.js';
import { Conversation, ConversationDocument } from '../database/schemas/conversation.schema.js';
import { Message, MessageDocument } from '../database/schemas/message.schema.js';
import { ErrorRetryLog, ErrorRetryLogDocument } from '../database/schemas/error-retry-log.schema.js';
import { QueueService, QueueName } from '../queues/queue.service.js';
import { decrypt } from '../lib/utils/encryption.js';
import { SocketGateway } from '../socket/socket.gateway.js';
import { env } from '@notifyiq/config';

export interface SendMessageDto {
  to: string; // Recipient phone number in E.164 format (e.g., "+919876543210")
  body: string;
}

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(Contact.name) private readonly contactModel: Model<ContactDocument>,
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
    @InjectModel(ErrorRetryLog.name) private readonly errorRetryLogModel: Model<ErrorRetryLogDocument>,
    private readonly socketGateway: SocketGateway,
    private readonly queueService: QueueService,
  ) { }

  async sendTextMessage(workspaceId: string, dto: SendMessageDto): Promise<MessageDocument> {
    // 1. Fetch Workspace & Decrypt WABA Access Token
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const waba = workspace.waba;
    if (!waba || !waba.accessToken || !waba.phoneNumberId) {
      throw new BadRequestException('WABA configuration is incomplete. Please connect your WABA.');
    }

    const isMock = process.env.MOCK_SERVICES === 'true';
    let decryptedToken = env.META_ACCESS_TOKEN;
    if (!isMock && waba.accessToken) {
      try {
        // decryptedToken = decrypt(waba.accessToken);
        console.log("decrypted token: ", decryptedToken);
      } catch (err) {
        console.error(err);
        decryptedToken = env.META_ACCESS_TOKEN;
      }
    }
    const phoneNumberId = waba.phoneNumberId;

    // 2. Validate Contact Consent & Opt-Out Status (DPDP Compliance)
    const phone = dto.to.startsWith('+') ? dto.to : `+${dto.to}`;
    let contact = await this.contactModel.findOne({ workspaceId, phone });

    if (contact) {
      if (contact.optedOut) {
        throw new ForbiddenException('Cannot send message. Recipient has opted out of WhatsApp communications.');
      }
      if (contact.deletionRequestedAt) {
        throw new ForbiddenException('Cannot send message. Recipient has requested data erasure.');
      }
    } else {
      // In compliance with DPDP, default consentGiven to false until explicit consent or inbound message
      contact = await this.contactModel.create({
        workspaceId,
        phone,
        name: 'WhatsApp User',
        consentGiven: false,
      });
    }

    // 3. Find or Create Conversation thread
    let conversation = await this.conversationModel.findOne({
      workspaceId,
      contactId: contact._id.toString(),
      phoneNumberId,
    });

    if (!conversation) {
      conversation = await this.conversationModel.create({
        workspaceId,
        contactId: contact._id.toString(),
        phoneNumberId,
        lastMessageAt: new Date(),
        sentiment: 'neutral',
        isHumanTakeover: true,
      });
    } else {
      // 24-hour service window check
      if (conversation.windowExpiresAt && new Date() > conversation.windowExpiresAt) {
        throw new BadRequestException(
          'The 24-hour WhatsApp customer service window has expired for this contact. Please send an approved Meta Template Message to re-engage.',
        );
      }
      conversation.lastMessageAt = new Date();
      // Auto-pause AI when agent sends manual reply
      conversation.isHumanTakeover = true;
      await conversation.save();

      this.socketGateway.emitToWorkspace(workspaceId, 'conversation.ai_toggled', {
        conversationId: conversation._id.toString(),
        isHumanTakeover: true,
      });
    }

    let waMessageId = '';
    // const isMock = process.env.MOCK_SERVICES === 'true';

    // 4. Send Message to Meta Cloud API
    if (!isMock) {
      try {
        console.log(`[MessagesService] Sending outbound message to Meta Cloud API for phone: ${phone} via PhoneID: ${phoneNumberId}`);
        const metaUrl = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

        const response = await fetch(metaUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${decryptedToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: phone.replace('+', ''), // Meta accepts digits only (no '+')
            type: 'text',
            text: {
              body: dto.body,
            },
          }),
        });

        const data = await response.json() as any;

        if (!response.ok || !data.messages?.[0]?.id) {
          const errMsg = data.error?.message || `Meta Graph API error (Code: ${data.error?.code || response.status})`;
          console.error('[MessagesService] Meta Cloud API outbound transmission failed:', data);

          const isTransient =
            response.status === 429 ||
            response.status >= 500 ||
            data.error?.code === 131056 ||
            data.error?.code === 130429;

          if (isTransient) {
            console.warn('[MessagesService] Transient Meta error encountered. Scheduling background retry...');
            const pendingMsg = await this.messageModel.create({
              workspaceId,
              conversationId: conversation._id.toString(),
              waMessageId: `wamid.retry_${crypto.randomBytes(8).toString('hex')}`,
              direction: 'outbound',
              type: 'text',
              status: 'pending',
              body: dto.body,
            });

            const errorLog = await this.errorRetryLogModel.create({
              workspaceId,
              messageId: pendingMsg._id,
              payload: {
                phoneNumberId,
                to: phone,
                type: 'text',
                body: dto.body,
              },
              attemptCount: 1,
              maxAttempts: 4,
              status: 'pending',
              nextRetryAt: new Date(Date.now() + 60000),
              lastError: errMsg,
              errorTrace: data,
            });

            await this.queueService.addJob(
              QueueName.ERROR_RETRY,
              'retry-failed-meta-call',
              { errorRetryLogId: errorLog._id.toString() },
              undefined,
              { delay: 60000 },
            );

            this.socketGateway.emitToWorkspace(workspaceId, 'message.sent', {
              message: pendingMsg,
              contact,
              conversation,
            });

            return pendingMsg;
          }

          throw new BadRequestException(errMsg);
        }

        waMessageId = data.messages[0].id;
      } catch (err: any) {
        if (err instanceof BadRequestException) {
          throw err;
        }
        console.error('[MessagesService] Outbound dispatch error:', err);
        throw new BadRequestException(err instanceof Error ? err.message : 'Meta dispatch failed');
      }
    } else {
      // Simulating successful outbound dispatch
      waMessageId = `wamid.mock_outbound_${crypto.randomBytes(16).toString('hex')}`;
      console.log(`[MessagesService] Mock Mode. Simulated message dispatch. ID: ${waMessageId}`);
    }

    // 5. Log & Save outbound Message
    const messageRecord = await this.messageModel.create({
      workspaceId,
      conversationId: conversation._id.toString(),
      waMessageId,
      direction: 'outbound',
      type: 'text',
      status: 'sent',
      body: dto.body,
    });

    // 6. Emit Socket event to workspace room for real-time inbox UI update
    this.socketGateway.emitToWorkspace(workspaceId, 'message.sent', {
      message: messageRecord,
      contact,
      conversation,
    });

    return messageRecord;
  }

  async getConversations(workspaceId: string): Promise<any[]> {
    // 1. Fetch conversations for workspace sorted by lastMessageAt desc
    const conversations = await this.conversationModel
      .find({ workspaceId })
      .sort({ lastMessageAt: -1 })
      .lean();

    const result: any[] = [];

    // 2. Hydrate each conversation card with contact details and last message body
    for (const conv of conversations) {
      const contact = await this.contactModel.findById(conv.contactId).lean();
      const lastMessage = await this.messageModel
        .findOne({ conversationId: conv._id.toString() })
        .sort({ createdAt: -1 })
        .lean();

      result.push({
        _id: conv._id.toString(),
        contactId: conv.contactId?.toString(),
        contactName: contact?.name || 'WhatsApp User',
        phone: contact?.phone || '',
        sentiment: conv.sentiment || 'neutral',
        lastMessageAt: conv.lastMessageAt,
        lastMessageText: lastMessage?.body || '',
        isHumanTakeover: conv.isHumanTakeover || false,
        status: conv.status || 'open',
        assignedTo: conv.assignedTo ? conv.assignedTo.toString() : null,
        lastInboundAt: conv.lastInboundAt || null,
        windowExpiresAt: conv.windowExpiresAt || null,
      });
    }

    return result;
  }

  async getMessageHistory(workspaceId: string, conversationId: string): Promise<MessageDocument[]> {
    // Verify conversation belongs to workspace
    const conv = await this.conversationModel.findOne({ _id: conversationId, workspaceId });
    if (!conv) {
      throw new NotFoundException('Conversation not found in this workspace');
    }

    return this.messageModel
      .find({ conversationId })
      .sort({ createdAt: 1 })
      .exec();
  }

  /**
   * Toggle AI auto-reply (Pause / Resume AI) for a conversation
   */
  async toggleAi(workspaceId: string, conversationId: string): Promise<{ isHumanTakeover: boolean }> {
    const conv = await this.conversationModel.findOne({ _id: conversationId, workspaceId });
    if (!conv) {
      throw new NotFoundException('Conversation not found in this workspace');
    }

    conv.isHumanTakeover = !conv.isHumanTakeover;
    await conv.save();

    this.socketGateway.emitToWorkspace(workspaceId, 'conversation.ai_toggled', {
      conversationId: conv._id.toString(),
      isHumanTakeover: conv.isHumanTakeover,
    });

    return { isHumanTakeover: conv.isHumanTakeover };
  }

  /**
   * Assign conversation to a staff user
   */
  async assignConversation(workspaceId: string, conversationId: string, staffId: string | null): Promise<ConversationDocument> {
    const conv = await this.conversationModel.findOne({ _id: conversationId, workspaceId });
    if (!conv) {
      throw new NotFoundException('Conversation not found in this workspace');
    }

    conv.assignedTo = staffId;
    await conv.save();

    this.socketGateway.emitToWorkspace(workspaceId, 'conversation.assigned', {
      conversationId: conv._id.toString(),
      assignedTo: staffId,
    });

    return conv;
  }

  /**
   * Update conversation status (open / pending / resolved)
   */
  async updateConversationStatus(workspaceId: string, conversationId: string, status: string): Promise<ConversationDocument> {
    const conv = await this.conversationModel.findOne({ _id: conversationId, workspaceId });
    if (!conv) {
      throw new NotFoundException('Conversation not found in this workspace');
    }

    conv.status = status;
    await conv.save();

    this.socketGateway.emitToWorkspace(workspaceId, 'conversation.status_updated', {
      conversationId: conv._id.toString(),
      status,
    });

    return conv;
  }

  async getCampaignStats(workspaceId: string): Promise<any> {
    const sentCount = await this.messageModel.countDocuments({ workspaceId, type: 'template', status: 'sent' });
    const failedCount = await this.messageModel.countDocuments({ workspaceId, type: 'template', status: 'failed' });
    const deliveredCount = await this.messageModel.countDocuments({ workspaceId, type: 'template', status: 'delivered' });
    const readCount = await this.messageModel.countDocuments({ workspaceId, type: 'template', status: 'read' });

    return {
      totalSent: sentCount + deliveredCount + readCount + failedCount,
      sent: sentCount,
      delivered: deliveredCount,
      read: readCount,
      failed: failedCount,
    };
  }
}
