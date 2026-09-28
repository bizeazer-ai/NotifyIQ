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

  /**
   * Evaluates sentiment & generates user summary for a conversation taking into account chat history + current message
   */
  async analyzeConversationSentiment(
    workspaceId: string,
    conversationId: string,
    currentMessageText: string,
  ): Promise<'positive' | 'neutral' | 'negative' | 'urgent'> {
    let sentiment: 'positive' | 'neutral' | 'negative' | 'urgent' = 'neutral';
    let userSummary: string | null = null;

    const conversation = await this.conversationModel.findById(conversationId);
    const existingSummary = conversation?.summary || '';

    try {
      // 1. Fetch last 15 messages of conversation for chat history context
      const recentMessages = await this.messageModel
        .find({ conversationId })
        .sort({ createdAt: -1 })
        .limit(15)
        .exec();

      const historyFormatted = recentMessages
        .reverse()
        .map((m) => `${m.direction === 'inbound' ? 'Customer' : 'Assistant'}: ${m.body}`)
        .join('\n');

      const sanitizedCurrent = currentMessageText.replace(/<[^>]*>/g, '').substring(0, 1000);

      const systemInstruction = `You are a customer conversation intelligence AI.
Analyze the customer's chat history and current message.
1) Generate a concise 2-3 sentence summary of the customer's overall intent, background, ongoing questions/issues ("userSummary").
2) Classify their overall sentiment strictly into one of: positive, neutral, negative, urgent ("sentiment").
Return JSON format: {"userSummary": "...", "sentiment": "positive"|"neutral"|"negative"|"urgent"}.`;

      const prompt = `Existing User Summary:\n${existingSummary || 'None'}\n\nRecent Chat History:\n${historyFormatted || 'No prior history'}\n\nCurrent Customer Message:\n"${sanitizedCurrent}"`;

      const res = await this.geminiService.generateJson<{ userSummary?: string; sentiment?: string }>(prompt, systemInstruction);

      if (res?.sentiment && ['positive', 'neutral', 'negative', 'urgent'].includes(res.sentiment.toLowerCase())) {
        sentiment = res.sentiment.toLowerCase() as any;
      } else {
        sentiment = this.fallbackKeywordSentiment(sanitizedCurrent);
      }

      if (res?.userSummary) {
        userSummary = res.userSummary.trim();
      }
    } catch (err: any) {
      this.logger.warn(`[SentimentService] History-based sentiment analysis failed, falling back: ${err.message}`);
      sentiment = this.fallbackKeywordSentiment(currentMessageText);
    }

    // 2. Update Conversation record in database with new sentiment and user summary
    if (conversation) {
      conversation.sentiment = sentiment;
      if (userSummary) {
        conversation.summary = userSummary;
      }
      await conversation.save();

      if (sentiment === 'negative' || sentiment === 'urgent') {
        this.logger.warn(`[SentimentService] Escalation triggered! Sentiment: ${sentiment} for workspace: ${workspaceId}`);
        this.socketGateway.emitToWorkspace(workspaceId, 'escalation.alert', {
          conversationId,
          sentiment,
          body: currentMessageText,
          timestamp: new Date(),
        });
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

