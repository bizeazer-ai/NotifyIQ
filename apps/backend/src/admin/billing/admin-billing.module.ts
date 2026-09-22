import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';
import { AdminBillingController } from './admin-billing.controller.js';
import { AdminBillingService } from './admin-billing.service.js';
import { AdminAuthModule } from '../auth/admin-auth.module.js';
import { AdminAuditInterceptor } from '../../common/interceptors/admin-audit.interceptor.js';

@Module({
  imports: [DatabaseModule, AdminAuthModule],
  controllers: [AdminBillingController],
  providers: [AdminBillingService, AdminAuditInterceptor],
  exports: [AdminBillingService],
})
export class AdminBillingModule {}
