import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { GeminiService } from './gemini.service.js';
import { DocumentParserService } from './document-parser.service.js';
import { ChunkingService } from './chunking.service.js';
import { SentimentService } from './sentiment.service.js';
import { WhisperService } from './whisper.service.js';
import { SuggestionsService } from './suggestions.service.js';
import { RagService } from './rag.service.js';
import { AiController } from './ai.controller.js';

@Module({
  imports: [DatabaseModule],
  controllers: [AiController],
  providers: [
    GeminiService,
    DocumentParserService,
    ChunkingService,
    SentimentService,
    WhisperService,
    SuggestionsService,
    RagService,
  ],
  exports: [
    GeminiService,
    DocumentParserService,
    ChunkingService,
    SentimentService,
    WhisperService,
    SuggestionsService,
    RagService,
  ],
})
export class AiModule {}
