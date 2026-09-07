import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GeminiService } from './gemini.service.js';
import { Conversation, ConversationDocument } from '../database/schemas/conversation.schema.js';
import { Message, MessageDocument } from '../database/schemas/message.schema.js';

@Injectable()
export class SuggestionsService {
  private readonly logger = new Logger(SuggestionsService.name);

  constructor(
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
    private readonly geminiService: GeminiService,
  ) {}

  /**
   * Generates 3 smart contextual suggested replies for a conversation thread using Gemini API
   */
  async generateSuggestions(workspaceId: string, conversationId: string): Promise<string[]> {
    const conversation = await this.conversationModel.findOne({ _id: conversationId, workspaceId });
    if (!conversation) {
      throw new NotFoundException('Conversation not found in this workspace');
    }

    const messages = await this.messageModel
      .find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(5);

    messages.reverse();

    if (messages.length === 0) {
      return ['Hi! How can I help you today?', 'Hello! Welcome to our support channel.', 'How may I assist you?'];
    }

    const lastMessage = messages[messages.length - 1]!;
    const lastText = lastMessage.body || '';

    try {
      const historyContext = messages
        .map((m) => `${m.direction === 'inbound' ? 'Customer' : 'Agent'}: ${m.body}`)
        .join('\n');

      const systemInstruction = `You are a customer support co-pilot. Analyze the chat history and suggest exactly 3 short, professional, and helpful replies that the agent can send to the customer.
Output MUST be JSON format: {"suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]}.`;

      const prompt = `Chat history:\n${historyContext}`;
      const res = await this.geminiService.generateJson<{ suggestions: string[] }>(prompt, systemInstruction);

      if (res?.suggestions && Array.isArray(res.suggestions) && res.suggestions.length >= 3) {
        return res.suggestions.slice(0, 3);
      }
    } catch (err: any) {
      this.logger.warn(`[SuggestionsService] Gemini suggestions generation failed, using keyword fallback: ${err.message}`);
    }

    return this.getKeywordSuggestions(lastText);
  }

  private getKeywordSuggestions(text: string): string[] {
    const cleanText = text.toLowerCase();
    if (/\b(fail|failed|money|deduct|refund|billing|invoice|payment|charge)\b/.test(cleanText)) {
      return [
        'Apologies for the billing trouble. I am checking our payment logs now.',
        'Could you please share the payment transaction ID so we can track it?',
        'Let me check if a refund is due and verify with our accounts team.',
      ];
    }
    if (/\b(agency|price|pricing|cost|whitelabel|whmcs|wholesale|sub-account|reseller)\b/.test(cleanText)) {
      return [
        'Yes, we support whitelabel CNAME domains and custom branding.',
        'Our agency plans offer a wholesale rate of $0.002 per message. Can I send you details?',
        'Let me set up an agency parent account for you to test custom branding settings.',
      ];
    }
    return [
      'Sure, let me check that information for you.',
      'Thank you for contacting us. Could you please share your registered email?',
      'Let me connect you to our technical support team.',
    ];
  }
}
