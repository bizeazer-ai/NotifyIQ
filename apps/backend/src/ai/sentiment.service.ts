import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GeminiService } from './gemini.service.js';
import { Message, MessageDocument } from '../database/schemas/message.schema.js';
import { Conversation, ConversationDocument } from '../database/schemas/conversation.schema.js';
import { SocketGateway } from '../socket/socket.gateway.js';

@Injectable()
export class SentimentService {
  private readonly logger = new Logger(SentimentService.name);

  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
    private readonly socketGateway: SocketGateway,
    private readonly geminiService: GeminiService,
  ) {}

  async analyzeMessageSentiment(messageId: string, text: string): Promise<string> {
    let sentiment: 'positive' | 'neutral' | 'negative' | 'urgent' = 'neutral';

    // 1. Sanitize & Truncate user input (Prompt Injection Shielding)
    const sanitizedText = text.replace(/<[^>]*>/g, '').substring(0, 1000);

    try {
      const systemInstruction = `You are a sentiment classification AI. Classify the sentiment of a WhatsApp customer message strictly into one of: positive, neutral, negative, urgent.
Return JSON format: {"sentiment": "positive"|"neutral"|"negative"|"urgent"}.`;

      const prompt = `Classify this customer message:\n"<user_message>${sanitizedText}</user_message>"`;
      const res = await this.geminiService.generateJson<{ sentiment: string }>(prompt, systemInstruction);

      if (res?.sentiment && ['positive', 'neutral', 'negative', 'urgent'].includes(res.sentiment.toLowerCase())) {
        sentiment = res.sentiment.toLowerCase() as any;
      } else {
        sentiment = this.fallbackKeywordSentiment(sanitizedText);
      }
    } catch (err: any) {
      this.logger.warn(`[SentimentService] Gemini classification failed, using keyword fallback: ${err.message}`);
      sentiment = this.fallbackKeywordSentiment(sanitizedText);
    }

    // 2. Fetch and Update Conversation thread with latest sentiment status
    const message = await this.messageModel.findById(messageId);
    if (message) {
      const conversation = await this.conversationModel.findById(message.conversationId);
      if (conversation) {
        conversation.sentiment = sentiment;
        await conversation.save();

        // 3. Trigger Real-Time Socket.io Escalation Alerts for urgent/negative sentiment
        if (sentiment === 'negative' || sentiment === 'urgent') {
          this.logger.warn(`[SentimentService] Escalation triggered! Sentiment: ${sentiment} for workspace: ${message.workspaceId}`);
          this.socketGateway.emitToWorkspace(
            message.workspaceId.toString(),
            'escalation.alert',
            {
              messageId: message._id.toString(),
              conversationId: conversation._id.toString(),
              sentiment,
              body: message.body,
              timestamp: new Date(),
            }
          );
        }
      }
    }

    return sentiment;
  }

  private fallbackKeywordSentiment(text: string): 'positive' | 'neutral' | 'negative' | 'urgent' {
    const cleanText = text.toLowerCase();
    if (/\b(urgent|now|emergency|help|asap|critical|immediate|soon|fire|broken)\b/.test(cleanText)) return 'urgent';
    if (/\b(bad|poor|terrible|worst|useless|horrible|angry|waste|scam|fraud|cancel|refund|fail|error|wrong)\b/.test(cleanText)) return 'negative';
    if (/\b(good|great|thanks|thank you|excellent|awesome|love|perfect|satisfy|appreciate|fine|resolved|yes)\b/.test(cleanText)) return 'positive';
    return 'neutral';
  }
}
