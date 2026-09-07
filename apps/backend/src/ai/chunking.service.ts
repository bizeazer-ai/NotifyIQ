import { Injectable } from '@nestjs/common';

export interface DocumentChunk {
  chunkIndex: number;
  content: string;
}

@Injectable()
export class ChunkingService {
  /**
   * Splits a long text document into overlapping chunks of approx 500 tokens (characters) with 50 token overlap
   */
  splitText(text: string, chunkSize: number = 500, overlap: number = 50): DocumentChunk[] {
    const cleanText = text.trim();
    if (!cleanText) return [];

    if (cleanText.length <= chunkSize) {
      return [{ chunkIndex: 0, content: cleanText }];
    }

    const chunks: DocumentChunk[] = [];
    let start = 0;
    let chunkIndex = 0;

    while (start < cleanText.length) {
      let end = start + chunkSize;

      // Try to break at whitespace/newline boundaries to avoid splitting words
      if (end < cleanText.length) {
        const lastSpace = cleanText.lastIndexOf(' ', end);
        if (lastSpace > start + chunkSize - 100) {
          end = lastSpace;
        }
      } else {
        end = cleanText.length;
      }

      const chunkContent = cleanText.substring(start, end).trim();
      if (chunkContent.length > 0) {
        chunks.push({
          chunkIndex,
          content: chunkContent,
        });
        chunkIndex++;
      }

      if (end >= cleanText.length) break;
      start = end - overlap;
    }

    return chunks;
  }
}
