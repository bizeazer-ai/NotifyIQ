import { Injectable, BadRequestException, ForbiddenException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
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

export interface SendMediaDto {
  to: string;
  type: 'image' | 'document' | 'video' | 'audio';
  mediaUrl: string;
  caption?: string;
  filename?: string;
}

export interface SendTemplateDto {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: any[];
  renderedBody?: string;
  mediaUrl?: string;
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

  /**
   * Helper: Resolves the actual WhatsApp Cloud API Phone Number ID.
   * Prevents using WABA / Business Account IDs (such as 1084973887457304) which Meta rejects for /media and /messages.
   */
  private async resolveRealPhoneNumberId(
    workspace: WorkspaceDocument,
    decryptedToken?: string,
  ): Promise<string> {
    const waba = workspace.waba;
    let phoneNumberId = waba?.phoneNumberId;
    const businessAccountId = waba?.businessAccountId;

    const isInvalidOrWabaId =
      !phoneNumberId ||
      phoneNumberId === businessAccountId 

    if (isInvalidOrWabaId) {
      const targetWabaId = businessAccountId;
      const token = decryptedToken || env.META_ACCESS_TOKEN;
      if (token) {
        try {
          const phoneRes = await fetch(
            `https://graph.facebook.com/v20.0/${targetWabaId}/phone_numbers`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          const phoneData = (await phoneRes.json()) as any;
          if (phoneData?.data?.[0]?.id) {
            phoneNumberId = phoneData.data[0].id;
            console.log(
              `[MessagesService] Auto-resolved real PhoneNumberId: ${phoneNumberId} for WABA: ${targetWabaId}`,
            );
            if (workspace.waba) {
              workspace.waba.phoneNumberId = phoneNumberId;
              if (!workspace.waba.businessAccountId) {
                workspace.waba.businessAccountId = targetWabaId;
              }
              await workspace.save();
            }
          }
        } catch (err: any) {
          console.warn(
            '[MessagesService] Could not auto-resolve phone number ID from Meta API:',
            err.message,
          );
        }
      }

    }

    return phoneNumberId || "";
  }

  /**
   * Validates workspace, WABA configurations, contact consent, and 24h service window.
   */
  private async prepareOutboundContext(workspaceId: string, recipientPhone: string, isTemplate = false) {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const waba = workspace.waba;
    if (!waba) {
      throw new BadRequestException('WABA configuration is incomplete. Please connect your WABA.');
    }

    const isMock = process.env.MOCK_SERVICES === 'true';
    let decryptedToken = env.META_ACCESS_TOKEN;
    if (!isMock && waba.accessToken) {
      try {
        console.log('decrypted token: ', decryptedToken);
      } catch (err) {
        console.error(err);
        decryptedToken = env.META_ACCESS_TOKEN;
      }
    }

    const phoneNumberId = await this.resolveRealPhoneNumberId(workspace, decryptedToken);
    if (!phoneNumberId && !isMock) {
      throw new BadRequestException('WABA Phone Number ID is missing. Please configure your phone number.');
    }
    const businessAccountId = waba.businessAccountId || '1084973887457304';

    const phone = recipientPhone.startsWith('+') ? recipientPhone : `+${recipientPhone}`;
    let contact = await this.contactModel.findOne({ workspaceId, phone });

    if (contact) {
      if (contact.optedOut) {
        throw new ForbiddenException('Cannot send message. Recipient has opted out of WhatsApp communications.');
      }
      if (contact.deletionRequestedAt) {
        throw new ForbiddenException('Cannot send message. Recipient has requested data erasure.');
      }
    } else {
      contact = await this.contactModel.create({
        workspaceId,
        phone,
        name: 'WhatsApp User',
        consentGiven: false,
      });
    }

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
      if (!isTemplate && conversation.windowExpiresAt && new Date() > conversation.windowExpiresAt) {
        throw new BadRequestException(
          'The 24-hour WhatsApp customer service window has expired for this contact. Please send an approved Meta Template Message to re-engage.',
        );
      }
      conversation.lastMessageAt = new Date();
      conversation.isHumanTakeover = true;
      await conversation.save();

      this.socketGateway.emitToWorkspace(workspaceId, 'conversation.ai_toggled', {
        conversationId: conversation._id.toString(),
        isHumanTakeover: true,
      });
    }

    return {
      workspace,
      waba,
      decryptedToken,
      phoneNumberId,
      businessAccountId,
      phone,
      contact,
      conversation,
      isMock,
    };
  }

  async sendTextMessage(workspaceId: string, dto: SendMessageDto): Promise<MessageDocument> {
    const {
      phoneNumberId,
      decryptedToken,
      phone,
      contact,
      conversation,
      isMock,
    } = await this.prepareOutboundContext(workspaceId, dto.to, false);

    let waMessageId = '';

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
            to: phone.replace('+', ''),
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
              messageId: pendingMsg._id.toString(),
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
      waMessageId = `wamid.mock_outbound_${crypto.randomBytes(16).toString('hex')}`;
      console.log(`[MessagesService] Mock Mode. Simulated message dispatch. ID: ${waMessageId}`);
    }

    const messageRecord = await this.messageModel.create({
      workspaceId,
      conversationId: conversation._id.toString(),
      waMessageId,
      direction: 'outbound',
      type: 'text',
      status: 'sent',
      body: dto.body,
    });

    this.socketGateway.emitToWorkspace(workspaceId, 'message.sent', {
      message: messageRecord,
      contact,
      conversation,
    });

    return messageRecord;
  }

  /**
   * Uploads binary media directly to Meta WhatsApp Cloud API /media endpoint.
   * Auto-resolves phone number ID if WABA ID is given, prioritizes active Meta token,
   * and falls back cleanly to local file storage if Meta direct upload encounters errors.
   */
  async uploadMediaToMeta(
    workspaceId: string,
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<{ mediaId?: string; url: string; metaUrl?: string }> {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const waba = workspace.waba;
    const isMock = process.env.MOCK_SERVICES === 'true';

    // Prioritize active env token so expired DB tokens never cause permission errors
    let decryptedToken = env.META_ACCESS_TOKEN;
    if (!decryptedToken && waba?.accessToken) {
      try {
        decryptedToken = decrypt(waba.accessToken);
      } catch {
        decryptedToken = env.META_ACCESS_TOKEN;
      }
    }

    const phoneNumberId = await this.resolveRealPhoneNumberId(workspace, decryptedToken);

    // Try direct Meta Cloud Media upload
    if (!isMock && decryptedToken && phoneNumberId) {
      try {
        console.log(`[MessagesService] Uploading media directly to Meta Cloud API for PhoneID: ${phoneNumberId} (${mimeType}, ${fileBuffer.length} bytes)...`);

        const form = new FormData();
        form.append('messaging_product', 'whatsapp');
        form.append('file', new Blob([fileBuffer as unknown as BlobPart], { type: mimeType }), filename);
        form.append('type', mimeType);

        const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/media`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${decryptedToken}`,
          },
          body: form,
        });

        const data = (await response.json()) as any;
        if (response.ok && data?.id) {
          const mediaId = data.id as string;
          console.log(`[MessagesService] Successfully uploaded to Meta Cloud API. Media ID: ${mediaId}`);

          // Production Best Practice: Cache uploaded media locally so proxy serving is instant and offline-resilient
          try {
            const uploadDir = path.resolve(process.cwd(), 'uploads');
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
            }
            const ext = path.extname(filename).toLowerCase() || '.bin';
            await fs.promises.writeFile(path.join(uploadDir, `meta_${mediaId}${ext}`), fileBuffer);
          } catch (cacheErr: any) {
            console.warn('[MessagesService] Could not cache uploaded media to local disk:', cacheErr.message);
          }

          let metaUrl: string | undefined;
          try {
            const detailRes = await fetch(`https://graph.facebook.com/v20.0/${mediaId}`, {
              headers: { Authorization: `Bearer ${decryptedToken}` },
            });
            const detailData = (await detailRes.json()) as any;
            if (detailData?.url) {
              metaUrl = detailData.url;
            }
          } catch (err: any) {
            console.warn('[MessagesService] Could not retrieve Meta direct media URL details:', err.message);
          }

          return {
            mediaId,
            url: `/api/messages/media/${mediaId}`,
            metaUrl,
          };
        } else {
          console.warn('[MessagesService] Meta /media direct upload returned non-OK, activating local storage fallback:', data);
        }
      } catch (err: any) {
        console.warn('[MessagesService] Direct Meta media upload error, activating local storage fallback:', err.message);
      }
    }

    // Resilient Fallback: Store locally and serve via static endpoint (ensures media sending NEVER fails)
    const uploadDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(filename).toLowerCase() || '.bin';
    const safeBase = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    const savedName = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}_${safeBase}${ext}`;
    const targetPath = path.join(uploadDir, savedName);

    await fs.promises.writeFile(targetPath, fileBuffer);
    console.log(`[MessagesService] Media saved locally: ${targetPath}`);

    return {
      url: `/api/messages/media/file/${savedName}`,
    };
  }

  async sendMediaMessage(workspaceId: string, dto: SendMediaDto): Promise<MessageDocument> {
    const {
      phoneNumberId,
      decryptedToken,
      phone,
      contact,
      conversation,
      isMock,
    } = await this.prepareOutboundContext(workspaceId, dto.to, false);

    let waMessageId = '';

    if (!isMock) {
      try {
        console.log(`[MessagesService] Sending outbound ${dto.type} message to Meta Cloud API for phone: ${phone} via PhoneID: ${phoneNumberId}`);
        const metaUrl = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

        let mediaPayload: any = {};

        // 1. Extract Meta media ID from /api/messages/media/:id or direct ID
        const metaMediaMatch = dto.mediaUrl.match(/\/api\/messages\/media\/([a-zA-Z0-9_-]+)/);
        if (metaMediaMatch && metaMediaMatch[1] && !metaMediaMatch[1].startsWith('mock_')) {
          mediaPayload.id = metaMediaMatch[1];
        } else if (/^\d+$/.test(dto.mediaUrl)) {
          mediaPayload.id = dto.mediaUrl;
        } else if (dto.mediaUrl.startsWith('/api/messages/media/file/')) {
          // Local fallback file: Attempt direct Meta upload or send as link
          const filename = path.basename(dto.mediaUrl);
          const localPath = path.resolve(process.cwd(), 'uploads', filename);
          if (fs.existsSync(localPath)) {
            try {
              const fileBuffer = await fs.promises.readFile(localPath);
              const ext = path.extname(filename).toLowerCase();
              let mimeType = 'application/octet-stream';
              if (['.jpg', '.jpeg'].includes(ext)) mimeType = 'image/jpeg';
              else if (ext === '.png') mimeType = 'image/png';
              else if (ext === '.webp') mimeType = 'image/webp';
              else if (ext === '.mp4') mimeType = 'video/mp4';
              else if (['.mp3', '.mpeg'].includes(ext)) mimeType = 'audio/mpeg';
              else if (ext === '.pdf') mimeType = 'application/pdf';

              const form = new FormData();
              form.append('messaging_product', 'whatsapp');
              form.append('file', new Blob([fileBuffer as unknown as BlobPart], { type: mimeType }), dto.filename || filename);
              form.append('type', mimeType);

              const uploadRes = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/media`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${decryptedToken}` },
                body: form,
              });
              const uploadData = (await uploadRes.json()) as any;
              if (uploadRes.ok && uploadData?.id) {
                mediaPayload.id = uploadData.id;
              } else {
                mediaPayload.link = dto.mediaUrl;
              }
            } catch {
              mediaPayload.link = dto.mediaUrl;
            }
          } else {
            mediaPayload.link = dto.mediaUrl;
          }
        } else {
          // Public external URL
          mediaPayload.link = dto.mediaUrl;
        }

        if (dto.caption && ['image', 'video', 'document'].includes(dto.type)) {
          mediaPayload.caption = dto.caption;
        }
        if (dto.type === 'document' && dto.filename) {
          mediaPayload.filename = dto.filename;
        }

        const response = await fetch(metaUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${decryptedToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: phone.replace('+', ''),
            type: dto.type,
            [dto.type]: mediaPayload,
          }),
        });

        const data = await response.json() as any;

        if (!response.ok || !data.messages?.[0]?.id) {
          const errMsg = data.error?.message || `Meta Graph API error (Code: ${data.error?.code || response.status})`;
          console.error('[MessagesService] Meta Cloud API outbound media transmission failed:', data);
          throw new BadRequestException(errMsg);
        }

        waMessageId = data.messages[0].id;
      } catch (err: any) {
        if (err instanceof BadRequestException) {
          throw err;
        }
        console.error('[MessagesService] Outbound media dispatch error:', err);
        throw new BadRequestException(err instanceof Error ? err.message : 'Meta media dispatch failed');
      }
    } else {
      waMessageId = `wamid.mock_media_${crypto.randomBytes(16).toString('hex')}`;
      console.log(`[MessagesService] Mock Mode. Simulated media dispatch. ID: ${waMessageId}`);
    }

    const messageRecord = await this.messageModel.create({
      workspaceId,
      conversationId: conversation._id.toString(),
      waMessageId,
      direction: 'outbound',
      type: dto.type,
      status: 'sent',
      body: dto.caption || dto.filename || `[${dto.type.toUpperCase()}]`,
      mediaUrl: dto.mediaUrl,
    });

    this.socketGateway.emitToWorkspace(workspaceId, 'message.sent', {
      message: messageRecord,
      contact,
      conversation,
    });

    return messageRecord;
  }

  async sendTemplateMessage(workspaceId: string, dto: SendTemplateDto): Promise<MessageDocument> {
    const {
      phoneNumberId,
      businessAccountId,
      decryptedToken,
      phone,
      contact,
      conversation,
      isMock,
    } = await this.prepareOutboundContext(workspaceId, dto.to, true);

    let originalLanguageCode = dto.languageCode && dto.languageCode !== 'en' ? dto.languageCode : 'en_US';
    if (!isMock && businessAccountId) {
      try {
        const tplLookupUrl = `https://graph.facebook.com/v20.0/${businessAccountId}/message_templates?name=${dto.templateName}`;
        const tplRes = await fetch(tplLookupUrl, {
          headers: { Authorization: `Bearer ${decryptedToken}` },
        });
        const tplData = (await tplRes.json()) as any;
        if (tplRes.ok && tplData.data && tplData.data.length > 0) {
          const matchedTpl = tplData.data.find((t: any) => t.name === dto.templateName);
          if (matchedTpl?.language) {
            originalLanguageCode = matchedTpl.language;
            console.log(`[MessagesService] Resolved template '${dto.templateName}' original language: '${originalLanguageCode}'`);
          }
        }
      } catch (err: any) {
        console.warn(`[MessagesService] Unable to fetch template language details from Meta: ${err.message}`);
      }
    }

    let waMessageId = '';

    if (!isMock) {
      try {
        console.log(`[MessagesService] Sending template '${dto.templateName}' (${originalLanguageCode}) to ${phone}`);
        const metaUrl = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

        const templatePayload: any = {
          name: dto.templateName,
          language: {
            code: originalLanguageCode,
          },
        };
        if (dto.components && dto.components.length > 0) {
          templatePayload.components = dto.components;
        }

        const response = await fetch(metaUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${decryptedToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: phone.replace('+', ''),
            type: 'template',
            template: templatePayload,
          }),
        });

        const data = await response.json() as any;

        if (!response.ok || !data.messages?.[0]?.id) {
          const errMsg = data.error?.message || `Meta Graph API error (Code: ${data.error?.code || response.status})`;
          console.error('[MessagesService] Meta Cloud API outbound template dispatch failed:', data);
          throw new BadRequestException(errMsg);
        }

        waMessageId = data.messages[0].id;
      } catch (err: any) {
        if (err instanceof BadRequestException) {
          throw err;
        }
        console.error('[MessagesService] Template dispatch error:', err);
        throw new BadRequestException(err instanceof Error ? err.message : 'Meta template dispatch failed');
      }
    } else {
      waMessageId = `wamid.mock_template_${crypto.randomBytes(16).toString('hex')}`;
      console.log(`[MessagesService] Mock Mode. Simulated template dispatch. ID: ${waMessageId}`);
    }

    const messageRecord = await this.messageModel.create({
      workspaceId,
      conversationId: conversation._id.toString(),
      waMessageId,
      direction: 'outbound',
      type: 'template',
      status: 'sent',
      body: dto.renderedBody || `[Template: ${dto.templateName}]`,
      mediaUrl: dto.mediaUrl || null,
    });

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

  async getMessageHistory(
    workspaceId: string,
    conversationId: string,
    limit = 20,
    before?: string,
  ): Promise<MessageDocument[]> {
    // Verify conversation belongs to workspace
    const conv = await this.conversationModel.findOne({ _id: conversationId, workspaceId });
    if (!conv) {
      throw new NotFoundException('Conversation not found in this workspace');
    }

    const query: any = { conversationId };
    if (before) {
      const beforeDate = new Date(before);
      if (!isNaN(beforeDate.getTime())) {
        query.createdAt = { $lt: beforeDate };
      }
    }

    const messages = await this.messageModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    return messages.reverse();
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
