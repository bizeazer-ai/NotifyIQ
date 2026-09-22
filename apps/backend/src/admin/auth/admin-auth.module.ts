import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';
import { AdminAuthController } from './admin-auth.controller.js';
import { AdminAuthService } from './admin-auth.service.js';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard.js';
import { AdminRbacGuard } from '../../common/guards/admin-rbac.guard.js';
import { IpAllowlistGuard } from '../../common/guards/ip-allowlist.guard.js';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminAuthGuard, AdminRbacGuard, IpAllowlistGuard],
  exports: [AdminAuthService, AdminAuthGuard, AdminRbacGuard, IpAllowlistGuard],
})
export class AdminAuthModule {}
