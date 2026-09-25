import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Worker, Job } from 'bullmq';
import crypto from 'crypto';
import { RedisService } from '../../common/services/redis.service.js';
import { QueueName } from '../queue.service.js';
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
}

@Injectable()
export class CampaignWorker implements OnModuleInit, OnModuleDestroy {
  private worker: Worker;

  constructor(
    private readonly redisService: RedisService,
    private readonly socketGateway: SocketGateway,
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(Contact.name) private readonly contactModel: Model<ContactDocument>,
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
  ) { }

  onModuleInit() {
    const connection = this.redisService.getClient();

    this.worker = new Worker(
      QueueName.CAMPAIGN,
      async (job: Job<CampaignJobData>) => {
        const { campaignId, workspaceId, templateName, contactIds, languageCode } = job.data;
        console.log(`[CampaignWorker] Executing campaign ${campaignId} for ${contactIds.length} contacts...`);

        // 1. Fetch Workspace & Decrypt WABA Access Token
        const workspace = await this.workspaceModel.findById(workspaceId);
        if (!workspace || !workspace.waba || !workspace.waba.accessToken) {
          throw new Error(`Workspace ${workspaceId} WABA credentials are missing`);
        }

        // const decryptedToken = decrypt(workspace.waba.accessToken);
        const decryptedToken = env.META_ACCESS_TOKEN;
        const phoneNumberId = workspace.waba.phoneNumberId;
        if (!phoneNumberId) {
          throw new Error(`Workspace ${workspaceId} WABA phone number ID is missing`);
        }
        const isMock = process.env.MOCK_SERVICES === 'true';

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

          // 4. Dispatch template message via Meta Cloud API
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
                      code: languageCode || 'en',
                    },
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
            } catch (err) {
              console.error(`[CampaignWorker] Meta API error for contact ${contact.phone}:`, err.message);
              waMessageId = `failed_${Date.now()}`;
            }
          } else {
            // Simulated success
            waMessageId = `wamid.mock_campaign_${campaignId}_${crypto.randomBytes(8).toString('hex')}`;
            successCount++;
          }

          // 5. Create Message Record
          const messageRecord = await this.messageModel.create({
            workspaceId,
            conversationId: conversation._id.toString(),
            waMessageId,
            direction: 'outbound',
            type: 'template',
            status: waMessageId.startsWith('failed') ? 'failed' : 'sent',
            body: `[Template Message: ${templateName}]`,
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
        connection,
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
