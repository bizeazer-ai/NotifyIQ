import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { SocketModule } from '../socket/socket.module.js';
import { AiModule } from '../ai/ai.module.js';
import { FlowsController } from './flows.controller.js';
import { FlowsService } from './flows.service.js';
import { FlowExecutionEngine } from './flow-execution.engine.js';

import { MessagesModule } from '../messages/messages.module.js';

@Module({
  imports: [DatabaseModule, SocketModule, AiModule, MessagesModule],
  controllers: [FlowsController],
  providers: [FlowsService, FlowExecutionEngine],
  exports: [FlowsService, FlowExecutionEngine],
})
export class FlowsModule {}

