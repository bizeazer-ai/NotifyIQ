import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';
import { AdminSecurityController } from './admin-security.controller.js';
import { AdminSecurityService } from './admin-security.service.js';
import { AdminAuthModule } from '../auth/admin-auth.module.js';
import { AdminAuditInterceptor } from '../../common/interceptors/admin-audit.interceptor.js';

@Module({
  imports: [DatabaseModule, AdminAuthModule],
  controllers: [AdminSecurityController],
  providers: [AdminSecurityService, AdminAuditInterceptor],
  exports: [AdminSecurityService],
})
export class AdminSecurityModule {}
