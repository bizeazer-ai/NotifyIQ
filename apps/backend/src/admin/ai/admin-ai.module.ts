import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';
import { AdminAiController } from './admin-ai.controller.js';
import { AdminAiService } from './admin-ai.service.js';
import { AdminAuthModule } from '../auth/admin-auth.module.js';
import { AdminAuditInterceptor } from '../../common/interceptors/admin-audit.interceptor.js';

@Module({
  imports: [DatabaseModule, AdminAuthModule],
  controllers: [AdminAiController],
  providers: [AdminAiService, AdminAuditInterceptor],
  exports: [AdminAiService],
})
export class AdminAiModule {}
