import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QueueService, QueueName, UnifiedWorker } from '../queue.service.js';
import crypto from 'crypto';
import { RedisService } from '../../common/services/redis.service.js';
import { Workspace, WorkspaceDocument } from '../../database/schemas/workspace.schema.js';
import { Contact, ContactDocument } from '../../database/schemas/contact.schema.js';
import { Conversation, ConversationDocument } from '../../database/schemas/conversation.schema.js';
import { Message, MessageDocument } from '../../database/schemas/message.schema.js';
import { decrypt } from '../../lib/utils/encryption.js';
import { SocketGateway } from '../../socket/socket.gateway.js';
import { env } from '@notifyiq/config';

interface CampaignJobData {
  campaignId: string;
  workspaceId: string;
  templateName: string;
  contactIds: string[];
  languageCode: string;
  templateParameters?: {
    headerUrl?: string;
    bodyParams?: string[];
    buttonParams?: string[];
  };
}

@Injectable()
export class CampaignWorker implements OnModuleInit, OnModuleDestroy {
  private worker: UnifiedWorker;

  constructor(
    private readonly queueService: QueueService,
    private readonly redisService: RedisService,
    private readonly socketGateway: SocketGateway,
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(Contact.name) private readonly contactModel: Model<ContactDocument>,
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
  ) { }

  onModuleInit() {
    this.worker = this.queueService.createWorker(
      QueueName.CAMPAIGN,
      async (job: any) => {
        const { campaignId, workspaceId, templateName, contactIds, languageCode, templateParameters } = job.data as CampaignJobData;
        console.log(`[CampaignWorker] Executing campaign ${campaignId} for ${contactIds.length} contacts...`);

        // 1. Fetch Workspace & Decrypt WABA Access Token
        const workspace = await this.workspaceModel.findById(workspaceId);
        if (!workspace || !workspace.waba || !workspace.waba.accessToken) {
          throw new Error(`Workspace ${workspaceId} WABA credentials are missing`);
        }

        // const decryptedToken = decrypt(workspace.waba.accessToken);
        const decryptedToken = env.META_ACCESS_TOKEN;
        let phoneNumberId = workspace.waba.phoneNumberId;
        const businessAccountId = workspace.waba.businessAccountId;
        if (!phoneNumberId || phoneNumberId === businessAccountId || phoneNumberId === '1084973887457304') {
          phoneNumberId = '1379849195205126';
          if (workspace.waba) {
            workspace.waba.phoneNumberId = phoneNumberId;
            workspace.save().catch(() => {});
          }
        }
        if (!phoneNumberId) {
          throw new Error(`Workspace ${workspaceId} WABA phone number ID is missing`);
        }
        const isMock = process.env.MOCK_SERVICES === 'true';

        // 1b. Resolve template's original registered language and components from Meta
        let originalLanguageCode = languageCode && languageCode !== 'en' ? languageCode : 'en_US';
        let templateBodyText = '';
        if (!isMock && businessAccountId) {
          try {
            const tplLookupUrl = `https://graph.facebook.com/v20.0/${businessAccountId}/message_templates?name=${templateName}`;
            const tplRes = await fetch(tplLookupUrl, {
              headers: { Authorization: `Bearer ${decryptedToken}` },
            });
            const tplData = (await tplRes.json()) as any;
            if (tplRes.ok && tplData.data && tplData.data.length > 0) {
              const matchedTpl = tplData.data.find((t: any) => t.name === templateName);
              if (matchedTpl?.language) {
                originalLanguageCode = matchedTpl.language;
                console.log(`[CampaignWorker] Resolved template '${templateName}' original language: '${originalLanguageCode}'`);
              }
              const bodyComp = matchedTpl?.components?.find((c: any) => c.type === 'BODY');
              if (bodyComp?.text) {
                templateBodyText = bodyComp.text;
              }
            }
          } catch (err: any) {
            console.warn(`[CampaignWorker] Unable to fetch template language details from Meta: ${err.message}`);
          }
        }

        let successCount = 0;
        let skipCount = 0;

        // 2. Loop through contact list sequentially to enforce rate-limiting
        for (const contactId of contactIds) {
          const contact = await this.contactModel.findById(contactId);

          // Skip if contact opted out or deletion is pending (DPDP Compliance check)
          if (!contact || contact.optedOut || contact.deletionRequestedAt) {
            skipCount++;
            continue;
          }

          // 3. Enforce 80 msg/sec rate limiting per sender phone number using Redis Token Bucket
          await this.enforceRateLimit(phoneNumberId);

          // Find or create conversation thread
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
            });
          }

          let waMessageId = '';

          // 3b. Build Meta components and resolved body text
          const metaComponents: any[] = [];
          if (templateParameters?.headerUrl) {
            metaComponents.push({
              type: 'header',
              parameters: [{ type: 'image', image: { link: templateParameters.headerUrl } }],
            });
          }

          let resolvedBody = templateBodyText;
          if (templateParameters?.bodyParams && templateParameters.bodyParams.length > 0) {
            const bodyParams = templateParameters.bodyParams.map((p, idx) => {
              const val = p
                .replace(/\{\{name\}\}/gi, contact.name || 'Customer')
                .replace(/\{\{phone\}\}/gi, contact.phone);
              if (resolvedBody) {
                resolvedBody = resolvedBody.replace(new RegExp(`\\{\\{${idx + 1}\\}\\}`, 'g'), val);
              }
              return { type: 'text', text: val };
            });

            metaComponents.push({
              type: 'body',
              parameters: bodyParams,
            });
          }

          // 4. Dispatch template message via Meta Cloud API using original language
          if (!isMock) {
            try {
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
                  to: contact.phone.replace('+', ''),
                  type: 'template',
                  template: {
                    name: templateName,
                    language: {
                      code: originalLanguageCode,
                    },
                    ...(metaComponents.length > 0 ? { components: metaComponents } : {}),
                  },
                }),
              });

              const data = await response.json() as any;

              if (response.ok && data.messages?.[0]?.id) {
                waMessageId = data.messages[0].id;
                successCount++;
              } else {
                console.error(`[CampaignWorker] Meta dispatch failed for contact ${contact.phone}:`, data);
                waMessageId = `failed_${Date.now()}`;
              }

            } catch (err: any) {
              console.error(`[CampaignWorker] Meta API error for contact ${contact.phone}:`, err.message);
              waMessageId = `failed_${Date.now()}`;
            }
          } else {
            // Simulated success
            waMessageId = `wamid.mock_campaign_${campaignId}_${crypto.randomBytes(8).toString('hex')}`;
            successCount++;
          }

          // 5. Create Message Record with resolved text & header mediaUrl
          const messageRecord = await this.messageModel.create({
            workspaceId,
            conversationId: conversation._id.toString(),
            waMessageId,
            direction: 'outbound',
            type: 'template',
            status: waMessageId.startsWith('failed') ? 'failed' : 'sent',
            body: resolvedBody || `[Template: ${templateName}]`,
            mediaUrl: templateParameters?.headerUrl || null,
          });

          // 6. Notify active client panels
          this.socketGateway.emitToWorkspace(workspaceId, 'message.sent', {
            message: messageRecord,
            contact,
            conversation,
          });
        }

        console.log(`[CampaignWorker] Campaign ${campaignId} execution complete. Sent: ${successCount}, Skipped: ${skipCount}`);

        return {
          campaignId,
          successCount,
          skipCount,
        };
      },
      {
        concurrency: 5, // process up to 5 campaigns in parallel
      },
    );

    this.worker.on('completed', (job) => {
      console.log(`[CampaignWorker] Job ${job.id} execution finished successfully`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`[CampaignWorker] Job ${job?.id} execution failed:`, err.message);
    });
  }

  /**
   * Implements a Redis Token Bucket rate limiting scheme to guarantee we do not exceed 80 msg/sec.
   * Capacity: 80 tokens, Refill Rate: 80 tokens/sec (1 token every 12.5 milliseconds)
   */
  private async enforceRateLimit(phoneNumberId: string): Promise<void> {
    const redis = this.redisService.getClient();
    const bucketKey = `waba:rate_limit:bucket:${phoneNumberId}`;
    const lastRefillKey = `waba:rate_limit:refill:${phoneNumberId}`;
    const limit = 80;
    const intervalMs = 1000;

    // LUA script to handle atomic Token Bucket evaluation
    const rateLimitScript = `
      local bucketKey = KEYS[1]
      local lastRefillKey = KEYS[2]
      local limit = tonumber(ARGV[1])
      local interval = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      
      local tokens = tonumber(redis.call('get', bucketKey) or limit)
      local lastRefill = tonumber(redis.call('get', lastRefillKey) or now)
      
      -- Calculate elapsed time and add tokens
      local elapsed = now - lastRefill
      local tokensToAdd = math.floor(elapsed * (limit / interval))
      
      if tokensToAdd > 0 then
        tokens = math.min(limit, tokens + tokensToAdd)
        redis.call('set', lastRefillKey, now)
      end
      
      if tokens > 0 then
        redis.call('set', bucketKey, tokens - 1)
        return 1 -- Allow request
      else
        return 0 -- Rate limited
      end
    `;

    let allowed = 0;
    let attempts = 0;

    while (allowed === 0) {
      const now = Date.now();

      // Execute the Lua script atomically on Redis
      allowed = await redis.eval(
        rateLimitScript,
        2,
        bucketKey,
        lastRefillKey,
        limit.toString(),
        intervalMs.toString(),
        now.toString()
      ) as number;

      if (allowed === 0) {
        attempts++;
        // Backoff slightly before trying again
        const sleepMs = attempts > 5 ? 50 : 12; // Sleep roughly 12.5ms (1 token generation time)
        await new Promise((resolve) => setTimeout(resolve, sleepMs));
      }
    }
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
      console.log('[CampaignWorker] Closed connection');
    }
  }
}
