import { Module } from '@nestjs/common';
import { AdminQueuesController } from './admin-queues.controller.js';
import { AdminQueuesService } from './admin-queues.service.js';
import { AdminAuthModule } from '../auth/admin-auth.module.js';
import { DatabaseModule } from '../../database/database.module.js';
import { AdminAuditInterceptor } from '../../common/interceptors/admin-audit.interceptor.js';

@Module({
  imports: [DatabaseModule, AdminAuthModule],
  controllers: [AdminQueuesController],
  providers: [AdminQueuesService, AdminAuditInterceptor],
  exports: [AdminQueuesService],
})
export class AdminQueuesModule {}
