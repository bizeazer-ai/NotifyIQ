import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contact, ContactDocument } from '../database/schemas/contact.schema.js';
import { Conversation, ConversationDocument } from '../database/schemas/conversation.schema.js';
import { Message, MessageDocument } from '../database/schemas/message.schema.js';
import { Workspace, WorkspaceDocument } from '../database/schemas/workspace.schema.js';
import { AuditLog, AuditLogDocument } from '../database/schemas/audit-log.schema.js';
import { LeadExtractionService } from './lead-extraction.service.js';
import { SocketGateway } from '../socket/socket.gateway.js';

export interface ImportChatHistoryResult {
  contactId: string;
  contactPhone: string;
  conversationId: string;
  totalMessagesImported: number;
  leadsDetected: number;
}

const LEAD_KEYWORDS = [
  'price',
  'pricing',
  'cost',
  'rate',
  'rates',
  'wholesale',
  'bulk',
  'quote',
  'quotation',
  'order',
  'catalogue',
  'catalog',
  'buy',
  'purchase',
  'discount',
  'deal',
  'sample',
  'inquiry',
];

@Injectable()
export class ChatHistoryImportService {
  private readonly logger = new Logger(ChatHistoryImportService.name);

  constructor(
    @InjectModel(Contact.name) private readonly contactModel: Model<ContactDocument>,
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
    private readonly leadExtractionService: LeadExtractionService,
    private readonly socketGateway: SocketGateway,
  ) {}

  /**
   * Parses WhatsApp chat export (.txt) and backfills contact, conversation, and messages.
   * Also seeds extracted leads if inquiry keywords are detected.
   */
  async importWhatsAppChat(
    workspaceId: string,
    fileContent: string,
    fallbackPhone?: string,
    businessIdentifier = 'You',
  ): Promise<ImportChatHistoryResult> {
    if (!fileContent || !fileContent.trim()) {
      throw new BadRequestException('Chat export file is empty');
    }

    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) {
      throw new BadRequestException('Workspace not found');
    }

    const lines = fileContent.split(/\r?\n/);
    interface ParsedMessage {
      dateStr: string;
      timeStr: string;
      sender: string;
      text: string;
      direction: 'inbound' | 'outbound';
    }

    const parsedMessages: ParsedMessage[] = [];
    let detectedContactName = '';
    let detectedPhone = '';

    // Android: 15/01/2024, 14:23 - Sender: Text
    // iOS: [15/01/24, 14:23:45] Sender: Text
    const androidRegex = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[apAP][mM])?)\s+-\s+([^:]+):\s+(.*)$/;
    const iosRegex = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[apAP][mM])?)\]\s+([^:]+):\s+(.*)$/;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      let match = line.match(androidRegex) || line.match(iosRegex);

      if (match) {
        const [, dateStr, timeStr, sender, text] = match;
        const isOutbound =
          sender.trim().toLowerCase() === businessIdentifier.toLowerCase() ||
          sender.trim().toLowerCase() === 'you';

        if (!isOutbound) {
          detectedContactName = sender.trim();
          // Check if sender is a phone number like +91 98765 43210 or 9876543210
          const digitsOnly = sender.replace(/\D/g, '');
          if (digitsOnly.length >= 10) {
            detectedPhone = sender.startsWith('+') ? sender.replace(/\s+/g, '') : `+${digitsOnly}`;
          }
        }

        parsedMessages.push({
          dateStr,
          timeStr,
          sender: sender.trim(),
          text: text.trim(),
          direction: isOutbound ? 'outbound' : 'inbound',
        });
      } else if (parsedMessages.length > 0) {
        // Multi-line continuation of previous message
        parsedMessages[parsedMessages.length - 1].text += `\n${line}`;
      }
    }

    if (parsedMessages.length === 0) {
      throw new BadRequestException(
        'Unable to parse WhatsApp chat export. Please ensure standard Android or iOS WhatsApp export format.',
      );
    }

    // Determine final phone number
    const finalPhone =
      (fallbackPhone ? (fallbackPhone.startsWith('+') ? fallbackPhone : `+${fallbackPhone}`) : detectedPhone) ||
      `+91${Date.now().toString().slice(-10)}`; // Fallback placeholder if no phone provided

    const finalName = detectedContactName && !detectedContactName.startsWith('+')
      ? detectedContactName
      : 'Imported WhatsApp Contact';

    // 1. Upsert Contact
    let contact = await this.contactModel.findOne({ workspaceId, phone: finalPhone });
    if (!contact) {
      contact = await this.contactModel.create({
        workspaceId,
        phone: finalPhone,
        name: finalName,
        tags: ['WhatsApp Import'],
        consentGiven: true,
      });
    } else if (contact.name === 'WhatsApp User' || !contact.name) {
      contact.name = finalName;
      if (!contact.tags.includes('WhatsApp Import')) {
        contact.tags.push('WhatsApp Import');
      }
      await contact.save();
    }

    // 2. Find or Create Conversation
    const phoneNumberId = workspace.waba?.phoneNumberId || 'import_placeholder_id';
    let conversation = await this.conversationModel.findOne({
      workspaceId,
      contactId: contact._id.toString(),
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
    }

    // 3. Batch insert messages
    let leadsDetected = 0;
    const leadNotes: string[] = [];

    const messageDocs = parsedMessages.map((msg, index) => {
      // Check for lead intent in inbound messages
      if (msg.direction === 'inbound') {
        const lower = msg.text.toLowerCase();
        const hasKeyword = LEAD_KEYWORDS.some((kw) => lower.includes(kw));
        if (hasKeyword) {
          leadsDetected++;
          if (leadNotes.length < 3) {
            leadNotes.push(msg.text);
          }
        }
      }

      return {
        workspaceId,
        conversationId: conversation._id.toString(),
        waMessageId: `wamid.import_${Date.now()}_${index}`,
        direction: msg.direction,
        type: 'text',
        status: 'delivered',
        body: msg.text,
        createdAt: new Date(),
      };
    });

    await this.messageModel.insertMany(messageDocs);

    // 4. Update Conversation last message
    const lastMsg = parsedMessages[parsedMessages.length - 1];
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // 5. Seed ExtractedLead if inquiry keywords were detected
    if (leadsDetected > 0) {
      await this.leadExtractionService.processExtractedLead(
        workspaceId,
        contact._id.toString(),
        contact.phone,
        {
          name: contact.name,
          category: 'Historical Import',
          productInterest: 'Imported Inquiries',
        },
        `Detected ${leadsDetected} inquiry keywords in imported chat:\n` + leadNotes.join('\n---\n'),
        0.90,
      );
    }

    // 6. Audit Log
    await this.auditLogModel.create({
      workspaceId,
      action: 'contact.chat_history_imported',
      resource: 'Contact',
      details: {
        contactId: contact._id.toString(),
        contactPhone: contact.phone,
        messagesImported: messageDocs.length,
        leadsDetected,
      },
    });

    // Notify UI to refresh conversations
    this.socketGateway.emitToWorkspace(workspaceId, 'conversation.updated', {
      conversationId: conversation._id.toString(),
      contactId: contact._id.toString(),
    });

    this.logger.log(
      `[ChatHistoryImport] Successfully imported ${messageDocs.length} messages for ${finalPhone} (${leadsDetected} leads detected)`,
    );

    return {
      contactId: contact._id.toString(),
      contactPhone: contact.phone,
      conversationId: conversation._id.toString(),
      totalMessagesImported: messageDocs.length,
      leadsDetected,
    };
  }
}
