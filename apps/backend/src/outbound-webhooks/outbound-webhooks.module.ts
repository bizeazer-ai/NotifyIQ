import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OutboundWebhook, OutboundWebhookSchema } from '../database/schemas/outbound-webhook.schema.js';
import { OutboundWebhooksController } from './outbound-webhook.controller.js';
import { OutboundWebhooksService } from './outbound-webhook.service.js';
import { OutboundWebhookDispatcher } from './outbound-webhook.dispatcher.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OutboundWebhook.name, schema: OutboundWebhookSchema },
    ]),
  ],
  controllers: [OutboundWebhooksController],
  providers: [OutboundWebhooksService, OutboundWebhookDispatcher],
  exports: [OutboundWebhookDispatcher], // Exported so listeners & workers can inject it
})
export class OutboundWebhooksModule {}
