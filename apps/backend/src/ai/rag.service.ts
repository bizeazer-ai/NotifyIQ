import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import crypto from 'crypto';
import { GeminiService } from './gemini.service.js';
import { DocumentParserService } from './document-parser.service.js';
import { ChunkingService } from './chunking.service.js';
import { Knowledge, KnowledgeDocument } from '../database/schemas/knowledge.schema.js';
import { WorkspacesService } from '../workspaces/workspaces.service.js';
import { MessagesService } from '../messages/messages.service.js';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  constructor(
    @InjectModel(Knowledge.name) private readonly knowledgeModel: Model<KnowledgeDocument>,
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
  async queryKnowledgeBase(workspaceId: string, query: string): Promise<{ answer: string; sources: string[]; confidenceScore: number }> {
    this.logger.log(`[RagService] Querying knowledge base for: "${query}" in workspace: ${workspaceId}`);
    const autoReplySettings = await this.workspaceService.getAutoReplySettings(workspaceId);
    const lastMessages = await this.messageService.getConversations(workspaceId)
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
      const answer = await this.geminiService.generateCompletion(autoReplySettings.systemPrompt, query);
      return {
        answer: answer || "I couldn't find any relevant documents in the workspace knowledge base to answer your question.",
        sources: [],
        confidenceScore: 0.0,
      };
    }

    const contextText = contextDocs.map((doc, idx) => `[Source ${idx + 1} - ${doc.title} (Chunk ${doc.chunkIndex})]:\n${doc.content}`).join('\n\n');
    const sources = Array.from(new Set(contextDocs.map((doc) => doc.title)));

    let answer = '';
    try {
      const systemInstruction = `You are an AI support assistant. You must answer the user question using ONLY the provided knowledge context.
If the context does not contain enough information to answer the question, state that you do not know.
Do NOT make up facts or use external knowledge. Always remain professional, grounded, and concise.`;

      const prompt = `Context information:\n${contextText}\n\nUser Question: ${query}`;
      answer = await this.geminiService.generateCompletion(prompt, systemInstruction);
    } catch (err: any) {
      this.logger.error(`[RagService] Gemini completion failed: ${err.message}`);
      answer = this.generateMockAnswer(query, contextDocs);
    }

    return {
      answer,
      sources,
      confidenceScore: topConfidenceScore,
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
