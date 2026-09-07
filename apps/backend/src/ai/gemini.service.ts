import { Injectable, Logger } from '@nestjs/common';
import { env } from '@notifyiq/config';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly completionModel = 'gemini-3.5-flash-lite';
  private readonly embeddingModel = 'gemini-embedding-001';

  /**
   * Generates text completions using Google Gemini (gemini-3.5-flash-lite)
   */
  async generateCompletion(prompt: string, systemInstruction?: string): Promise<string> {
    const apiKey = env.GEMINI_API_KEY;
    const isMock = process.env.MOCK_SERVICES === 'true' || !apiKey;

    if (isMock) {
      this.logger.debug('[GeminiService] Running in mock/dev mode. Generating mock text completion.');
      return this.generateMockCompletion(prompt);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.completionModel}:generateContent?key=${apiKey}`;

      const contents: any[] = [];
      if (systemInstruction) {
        contents.push({
          role: 'user',
          parts: [{ text: `[System Instruction]: ${systemInstruction}` }],
        });
      }
      contents.push({
        role: 'user',
        parts: [{ text: prompt }],
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      });

      const data = (await response.json()) as any;
      if (!response.ok || !data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error(data.error?.message || 'Gemini completion response invalid');
      }

      return data.candidates[0].content.parts[0].text.trim();
    } catch (err: any) {
      this.logger.error(`[GeminiService] Text completion error: ${err.message}. Falling back to mock.`);
      return this.generateMockCompletion(prompt);
    }
  }

  /**
   * Generates structured JSON responses using Google Gemini
   */
  async generateJson<T>(prompt: string, systemInstruction?: string): Promise<T> {
    const apiKey = env.GEMINI_API_KEY;
    const isMock = process.env.MOCK_SERVICES === 'true' || !apiKey;

    if (isMock) {
      this.logger.debug('[GeminiService] Running in mock/dev mode. Generating mock JSON response.');
      return this.generateMockJson<T>(prompt);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.completionModel}:generateContent?key=${apiKey}`;

      const systemContext = systemInstruction
        ? `${systemInstruction}\nOutput MUST be valid JSON format strictly matching requested schema.`
        : 'Output MUST be valid JSON format strictly matching requested schema.';

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `[Instruction]: ${systemContext}\n\n${prompt}` }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      });

      const data = (await response.json()) as any;
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!response.ok || !rawText) {
        throw new Error(data.error?.message || 'Gemini JSON response invalid');
      }

      return JSON.parse(rawText) as T;
    } catch (err: any) {
      this.logger.error(`[GeminiService] JSON generation error: ${err.message}. Falling back to mock.`);
      return this.generateMockJson<T>(prompt);
    }
  }

  /**
   * Generates 768-dimensional vector embeddings using Google Gemini (gemini-embedding-001)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const apiKey = env.GEMINI_API_KEY;
    const isMock = process.env.MOCK_SERVICES === 'true' || !apiKey;

    if (isMock) {
      // Return 768-dimensional normalized mock vector for local development
      return this.generateMockEmbedding(text);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.embeddingModel}:embedContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: `models/${this.embeddingModel}`,
          content: {
            parts: [{ text }],
          },
        }),
      });

      const data = (await response.json()) as any;
      if (!response.ok || !data.embedding?.values) {
        throw new Error(data.error?.message || 'Gemini embedding response invalid');
      }

      return data.embedding.values;
    } catch (err: any) {
      this.logger.error(`[GeminiService] Embedding error: ${err.message}. Falling back to mock 768-dim vector.`);
      return this.generateMockEmbedding(text);
    }
  }

  private generateMockCompletion(prompt: string): string {
    if (/sentiment/i.test(prompt)) {
      return JSON.stringify({ sentiment: 'positive', score: 0.92 });
    }
    if (/suggest|reply/i.test(prompt)) {
      return JSON.stringify({
        suggestions: [
          'Hello! How can I assist you today?',
          'Thanks for contacting support. We received your request.',
          'Sure! Let me check the details for you immediately.',
        ],
      });
    }
    return 'Thank you for reaching out to NotifyIQ customer support. We are happy to help you!';
  }

  private generateMockJson<T>(prompt: string): T {
    if (/sentiment/i.test(prompt)) {
      return { sentiment: 'positive', score: 0.95 } as T;
    }
    if (/suggest/i.test(prompt)) {
      return {
        suggestions: [
          'Thank you for reaching out! How can I help?',
          'We have received your query and will update you shortly.',
          'Please share your workspace ID so we can verify your account.',
        ],
      } as T;
    }
    return { success: true } as T;
  }

  private generateMockEmbedding(text: string): number[] {
    // Generate deterministic 768-dim mock vector based on string characters
    const vector = new Array(768).fill(0);
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    for (let i = 0; i < 768; i++) {
      vector[i] = Math.sin(hash + i) * 0.5 + 0.5;
    }
    return vector;
  }
}
