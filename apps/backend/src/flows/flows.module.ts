import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { SocketModule } from '../socket/socket.module.js';
import { AiModule } from '../ai/ai.module.js';
import { FlowsController } from './flows.controller.js';
import { FlowsService } from './flows.service.js';
import { FlowExecutionEngine } from './flow-execution.engine.js';

@Module({
  imports: [DatabaseModule, SocketModule, AiModule],
  controllers: [FlowsController],
  providers: [FlowsService, FlowExecutionEngine],
  exports: [FlowsService, FlowExecutionEngine],
})
export class FlowsModule {}
