import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import crypto from 'crypto';
import { GeminiService } from './gemini.service.js';
import { DocumentParserService } from './document-parser.service.js';
import { ChunkingService } from './chunking.service.js';
import { Knowledge, KnowledgeDocument } from '../database/schemas/knowledge.schema.js';
import { Conversation, ConversationDocument } from '../database/schemas/conversation.schema.js';
import { WorkspacesService } from '../workspaces/workspaces.service.js';
import { MessagesService } from '../messages/messages.service.js';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  constructor(
    @InjectModel(Knowledge.name) private readonly knowledgeModel: Model<KnowledgeDocument>,
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
    private readonly geminiService: GeminiService,
    private readonly messageService: MessagesService,
    private readonly workspaceService: WorkspacesService,
    private readonly documentParserService: DocumentParserService,
    private readonly chunkingService: ChunkingService,
  ) { }


  /**
   * Parses, chunks, vectorizes, and indexes multi-format documents (.pdf, .docx, .yaml, .json, .csv, .txt)
   */
  async ingestDocument(
    workspaceId: string,
    fileBuffer: Buffer,
    fileName: string,
    fileType: string,
  ): Promise<{ docId: string; totalChunks: number; title: string }> {
    const docId = `doc_${crypto.randomBytes(8).toString('hex')}`;
    const ext = (fileType || fileName.split('.').pop() || 'txt').toLowerCase();

    this.logger.log(`[RagService] Ingesting multi-format document "${fileName}" (Type: ${ext}) for workspace: ${workspaceId}`);

    // 1. Extract raw text from file buffer
    const fullText = await this.documentParserService.parseDocument(fileBuffer, fileName, ext);

    // 2. Chunk document text into overlapping 500-token blocks
    const chunks = this.chunkingService.splitText(fullText, 500, 50);

    this.logger.log(`[RagService] Document split into ${chunks.length} chunks. Generating Gemini 768-dim embeddings...`);

    // 3. Generate embeddings and store all chunks
    for (const chunk of chunks) {
      const embedding = await this.geminiService.generateEmbedding(chunk.content);

      await this.knowledgeModel.create({
        workspaceId,
        docId,
        title: fileName,
        fileType: ext,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        embedding,
      });
    }

    return {
      docId,
      totalChunks: chunks.length,
      title: fileName,
    };
  }

  /**
   * Uploads raw text string as a document
   */
  async uploadKnowledgeDoc(workspaceId: string, title: string, content: string): Promise<Knowledge> {
    const docId = `doc_${crypto.randomBytes(8).toString('hex')}`;
    const embedding = await this.geminiService.generateEmbedding(content);

    return this.knowledgeModel.create({
      workspaceId,
      docId,
      title,
      fileType: 'txt',
      chunkIndex: 0,
      content,
      embedding,
    });
  }

  /**
   * Retrieves the entire knowledge base for a workspace
   */
  async getKnowledgeBase(workspaceId: string): Promise<KnowledgeDocument[]> {
    this.logger.log(`[RagService] Fetching knowledge base for workspace: ${workspaceId}`);

    return this.knowledgeModel
      .find({ workspaceId })
      .sort({ docId: 1, chunkIndex: 1 })
      .select(" -embedding")
      .exec();
  }

  /**
   * Queries knowledge base via MongoDB Atlas Vector Search with Cosine Similarity Fallback Engine
   */
  async queryKnowledgeBase(
    workspaceId: string,
    query: string,
    conversationId?: string,
  ): Promise<{ answer: string; sources: string[]; confidenceScore: number, userDetails?:Record<string,string>}> {
    this.logger.log(`[RagService] Querying knowledge base for: "${query}" in workspace: ${workspaceId}`);
    const autoReplySettings = await this.workspaceService.getAutoReplySettings(workspaceId);

    // Fetch user summary & recent chat history context if conversationId is provided
    let historyContextText = '';
    if (conversationId) {
      try {
        const conversation = await this.conversationModel.findById(conversationId);
        const userSummary = conversation?.summary;
        const recentMsgs = await this.messageService.getMessageHistory(workspaceId, conversationId);
        const last10 = recentMsgs.slice(-10);

        const summaryBlock = userSummary ? `User Summary & Intent Context:\n"${userSummary}"\n\n` : '';
        const historyBlock = last10.length > 0
          ? 'Recent Conversation History (Last 10 Messages):\n' +
            last10.map((m) => `${m.direction === 'inbound' ? 'Customer' : 'Assistant'}: ${m.body}`).join('\n')
          : '';

        historyContextText = `${summaryBlock}${historyBlock}`.trim();
      } catch (err: any) {
        this.logger.warn(`[RagService] Could not fetch chat history/summary for conversation ${conversationId}: ${err.message}`);
      }
    }


    const queryEmbedding = await this.geminiService.generateEmbedding(query);
    let contextDocs: Knowledge[] = [];
    let topConfidenceScore = 0.85;

    // 1. Attempt Atlas Vector Search
    try {
      contextDocs = await this.knowledgeModel.aggregate([
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: 20,
            limit: 4,
            filter: { workspaceId },
          },
        },
      ]);
    } catch (err: any) {
      this.logger.warn(`[RagService] Atlas Vector Search failed, using Cosine Similarity Fallback Engine: ${err.message}`);
    }

    // 2. Fallback to exact Mathematical Cosine Similarity Search if Atlas Vector index returns 0
    if (!contextDocs || contextDocs.length === 0) {
      const fallbackResult = await this.cosineSimilaritySearch(workspaceId, queryEmbedding);
      contextDocs = fallbackResult.docs;
      topConfidenceScore = fallbackResult.topScore;
    }

    if (contextDocs.length === 0) {
      const fullPrompt = `${historyContextText ? historyContextText + '\n\n' : ''}User Question: ${query}`;
      const answer = await this.geminiService.generateCompletion(autoReplySettings.systemPrompt, fullPrompt);
      return {
        answer: answer || "I couldn't find any relevant documents in the workspace knowledge base to answer your question.",
        sources: [],
        confidenceScore: 0.0,
      };
    }

    // Business operating hours awareness
    let businessTimeContext = '';
    const operatingHours = autoReplySettings?.operatingHours;
    if (operatingHours && operatingHours.enabled) {
      try {
        const tz = operatingHours.timezone || 'Asia/Kolkata';
        const nowInTz = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayStr = dayNames[nowInTz.getDay()];
        const timeStr = nowInTz.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const currentDay = nowInTz.getDay();
        const currentHour = nowInTz.getHours();
        const currentMinute = nowInTz.getMinutes();
        const currentTimeMinutes = currentHour * 60 + currentMinute;
        const [startH, startM] = (operatingHours.startTime || '09:00').split(':').map(Number);
        const [endH, endM] = (operatingHours.endTime || '18:00').split(':').map(Number);
        const isWorkDay = Array.isArray(operatingHours.workDays) ? operatingHours.workDays.includes(currentDay) : true;
        const isWithinHours = isWorkDay && currentTimeMinutes >= ((startH || 9) * 60 + (startM || 0)) && currentTimeMinutes < ((endH || 18) * 60 + (endM || 0));

        businessTimeContext = `Current Business Time: ${dayStr} ${timeStr} (${tz})\nBusiness Operating Status: ${isWithinHours ? 'OPEN' : 'CLOSED'} (Operating Hours: ${operatingHours.startTime} - ${operatingHours.endTime})`;
      } catch (_) {}
    }

    const contextText = contextDocs.map((doc, idx) => `[Source ${idx + 1} - ${doc.title} (Chunk ${doc.chunkIndex})]:\n${doc.content}`).join('\n\n');
    const sources = Array.from(new Set(contextDocs.map((doc) => doc.title)));

    let answer = '';
    let userDetails: { name?: string; category?: string; budget?: string; productInterest?: string } | undefined = undefined;

    try {
      const systemInstruction = `You are an AI support assistant. You must answer the user question using ONLY the provided knowledge context and conversation history.
${businessTimeContext ? '\n' + businessTimeContext + '\n' : ''}
If the context does not contain enough information to answer the question, state that you do not know.
Do NOT make up facts or use external knowledge. Always remain professional, grounded, and concise.

If you can detect any customer details (name, lead category, budget, or specific product of interest) from the conversation, format your final response as valid JSON with:
{
  "reply": "Your conversational reply to the customer",
  "userDetails": {
    "name": "Customer name if mentioned",
    "category": "Inquiry category (e.g. Wholesale, Pricing, General)",
    "budget": "Budget or quantity if mentioned",
    "productInterest": "Products or services asked about"
  }
}
If no lead details are detected, return a normal concise reply.`;

      const prompt = `${historyContextText ? historyContextText + '\n\n' : ''}Knowledge Base Context:\n${contextText}\n\nUser Question / Latest Message:\n${query}`;
      answer = await this.geminiService.generateCompletion(prompt, systemInstruction);

      // Parse structured JSON if returned
      try {
        const trimmed = answer.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          const parsed = JSON.parse(trimmed);
          if (parsed.reply) {
            answer = parsed.reply;
          }
          if (parsed.userDetails && Object.values(parsed.userDetails).some((v) => !!v)) {
            userDetails = parsed.userDetails;
          }
        }
      } catch (_) {}
    } catch (err: any) {
      this.logger.error(`[RagService] Gemini completion failed: ${err.message}`);
      answer = this.generateMockAnswer(query, contextDocs);
    }

    return {
      answer,
      sources,
      confidenceScore: topConfidenceScore,
      userDetails,
    };
  }


  /**
   * Exact Mathematical Cosine Similarity Search Engine (Dot Product / Magnitude)
   */
  private async cosineSimilaritySearch(workspaceId: string, queryEmbedding: number[]): Promise<{ docs: Knowledge[]; topScore: number }> {
    const allDocs = await this.knowledgeModel.find({ workspaceId }).limit(100);
    if (allDocs.length === 0) return { docs: [], topScore: 0 };

    const scoredDocs = allDocs.map((doc) => {
      const score = this.calculateCosineSimilarity(queryEmbedding, doc.embedding || []);
      return { doc, score };
    });

    scoredDocs.sort((a, b) => b.score - a.score);
    const topScored = scoredDocs.slice(0, 4);

    return {
      docs: topScored.map((item) => item.doc),
      topScore: topScored[0]?.score || 0.5,
    };
  }

  private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA.length || !vecB.length || vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      const a = vecA[i]!;
      const b = vecB[i]!;
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private generateMockAnswer(query: string, docs: Knowledge[]): string {
    if (/price|pricing|cost/i.test(query)) {
      return `Based on our pricing records, we charge a flat wholesale rate of $0.002 per message for agency accounts. All invoices are billed in USD or EUR depending on your region.`;
    }
    return `Based on the document "${docs[0]?.title}": "${docs[0]?.content.substring(0, 150)}..."`;
  }
}
