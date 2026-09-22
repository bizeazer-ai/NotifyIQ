import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminInfraService } from './admin-infra.service.js';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard.js';
import { AdminRbacGuard } from '../../common/guards/admin-rbac.guard.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';

@ApiTags('Admin / Infrastructure')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, AdminRbacGuard)
@Controller('api/admin/infra')
export class AdminInfraController {
  constructor(private readonly adminInfraService: AdminInfraService) {}

  @Get('health')
  @RequirePermissions('system:infra_view')
  @ApiOperation({ summary: 'System health monitoring (MongoDB, Redis, Process memory, uptime)' })
  async getInfraHealth() {
    return this.adminInfraService.getInfraHealth();
  }
}
