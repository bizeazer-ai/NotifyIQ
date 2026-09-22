import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';
import { AdminWorkspacesController } from './admin-workspaces.controller.js';
import { AdminWorkspacesService } from './admin-workspaces.service.js';
import { AdminAuthModule } from '../auth/admin-auth.module.js';
import { AdminAuditInterceptor } from '../../common/interceptors/admin-audit.interceptor.js';

@Module({
  imports: [DatabaseModule, AdminAuthModule],
  controllers: [AdminWorkspacesController],
  providers: [AdminWorkspacesService, AdminAuditInterceptor],
  exports: [AdminWorkspacesService],
})
export class AdminWorkspacesModule {}
