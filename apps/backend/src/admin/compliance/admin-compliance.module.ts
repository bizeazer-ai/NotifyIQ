import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';
import { AdminComplianceController } from './admin-compliance.controller.js';
import { AdminComplianceService } from './admin-compliance.service.js';
import { AdminAuthModule } from '../auth/admin-auth.module.js';
import { AdminAuditInterceptor } from '../../common/interceptors/admin-audit.interceptor.js';

@Module({
  imports: [DatabaseModule, AdminAuthModule],
  controllers: [AdminComplianceController],
  providers: [AdminComplianceService, AdminAuditInterceptor],
  exports: [AdminComplianceService],
})
export class AdminComplianceModule {}
