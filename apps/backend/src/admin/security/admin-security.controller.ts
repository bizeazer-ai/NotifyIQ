import { Controller, Get, Post, Delete, Param, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminSecurityService } from './admin-security.service.js';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard.js';
import { AdminRbacGuard } from '../../common/guards/admin-rbac.guard.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import { AdminAuditInterceptor } from '../../common/interceptors/admin-audit.interceptor.js';

@ApiTags('Admin / Security')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, AdminRbacGuard)
@UseInterceptors(AdminAuditInterceptor)
@Controller('api/admin/security')
export class AdminSecurityController {
  constructor(private readonly adminSecurityService: AdminSecurityService) {}

  @Get('sessions')
  @RequirePermissions('admin:security_center')
  @ApiOperation({ summary: 'Active SuperAdmin sessions review' })
  async getActiveSessions() {
    return this.adminSecurityService.getActiveSessions();
  }

  @Delete('sessions/:id')
  @RequirePermissions('admin:security_center')
  @ApiOperation({ summary: 'Force terminate an active SuperAdmin session' })
  async revokeSession(@Param('id') id: string) {
    return this.adminSecurityService.revokeSession(id);
  }

  @Get('failed-logins')
  @RequirePermissions('admin:security_center')
  @ApiOperation({ summary: 'Failed login attempts and account lockout monitor' })
  async getFailedLogins() {
    return this.adminSecurityService.getFailedLogins();
  }

  @Get('keys')
  @RequirePermissions('admin:key_rotation')
  @ApiOperation({ summary: 'Platform-wide API key & webhook secret inventory' })
  async getKeyInventory() {
    return this.adminSecurityService.getKeyInventory();
  }

  @Post('keys/rotate')
  @RequirePermissions('admin:key_rotation')
  @ApiOperation({ summary: 'Initiate platform key rotation' })
  async rotateKey(@Body('keyName') keyName: string, @Body('reasonCode') reasonCode?: string) {
    return this.adminSecurityService.rotateKey(keyName, reasonCode);
  }
}
