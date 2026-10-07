import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { OutboundWebhooksController } from './outbound-webhook.controller.js';
import { OutboundWebhooksService } from './outbound-webhook.service.js';
import { OutboundWebhookDispatcher } from './outbound-webhook.dispatcher.js';

@Module({
  imports: [DatabaseModule],
  controllers: [OutboundWebhooksController],
  providers: [OutboundWebhooksService, OutboundWebhookDispatcher],
  exports: [OutboundWebhookDispatcher], // Exported so listeners & workers can inject it
})
export class OutboundWebhooksModule {}
