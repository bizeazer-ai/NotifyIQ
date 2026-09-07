import { Injectable, BadRequestException, Logger } from '@nestjs/common';

@Injectable()
export class DocumentParserService {
  private readonly logger = new Logger(DocumentParserService.name);

  /**
   * Extracts raw readable text content from uploaded file buffers based on file extension
   */
  async parseDocument(fileBuffer: Buffer, fileName: string, fileType: string): Promise<string> {
    const ext = (fileType || fileName.split('.').pop() || 'txt').toLowerCase();

    this.logger.log(`[DocumentParserService] Parsing document "${fileName}" of type: ${ext}`);

    switch (ext) {
      case 'txt':
      case 'text':
        return fileBuffer.toString('utf-8');

      case 'json':
        try {
          const jsonObj = JSON.parse(fileBuffer.toString('utf-8'));
          return JSON.stringify(jsonObj, null, 2);
        } catch {
          return fileBuffer.toString('utf-8');
        }

      case 'yaml':
      case 'yml':
        return fileBuffer.toString('utf-8');

      case 'csv':
        return this.parseCsvText(fileBuffer.toString('utf-8'));

      case 'pdf':
        return this.parsePdfBuffer(fileBuffer);

      case 'docx':
      case 'doc':
        return this.parseDocxBuffer(fileBuffer);

      default:
        return fileBuffer.toString('utf-8');
    }
  }

  private parseCsvText(csvContent: string): string {
    const lines = csvContent.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length === 0) return '';

    const headers = lines[0]!.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1);

    return rows
      .map((row, idx) => {
        const values = row.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const pairs = headers.map((header, i) => `${header}: ${values[i] || ''}`);
        return `[Row ${idx + 1}]\n${pairs.join('\n')}`;
      })
      .join('\n\n');
  }

  private parsePdfBuffer(fileBuffer: Buffer): string {
    const rawStr = fileBuffer.toString('utf-8');
    // Extract plain readable text characters from PDF stream
    const cleanedText = rawStr
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return cleanedText.length > 50 ? cleanedText : `[PDF Document Text Content]\n${rawStr.substring(0, 2000)}`;
  }

  private parseDocxBuffer(fileBuffer: Buffer): string {
    const rawStr = fileBuffer.toString('utf-8');
    const cleanedText = rawStr
      .replace(/<[^>]*>/g, ' ')
      .replace(/[\x00-\x1F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return cleanedText.length > 50 ? cleanedText : `[Word Document Content]\n${rawStr.substring(0, 2000)}`;
  }
}
