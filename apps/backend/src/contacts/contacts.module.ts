import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { OutboundWebhooksModule } from '../outbound-webhooks/outbound-webhooks.module.js';
import { ContactsService } from './contacts.service.js';
import { ContactsController } from './contacts.controller.js';
import { LeadExtractionService } from './lead-extraction.service.js';
import { ChatHistoryImportService } from './chat-history-import.service.js';

@Module({
  imports: [DatabaseModule, OutboundWebhooksModule],
  controllers: [ContactsController],
  providers: [ContactsService, LeadExtractionService, ChatHistoryImportService],
  exports: [ContactsService, LeadExtractionService, ChatHistoryImportService],
})
export class ContactsModule {}

