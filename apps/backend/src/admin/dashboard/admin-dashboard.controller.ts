import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminDashboardService } from './admin-dashboard.service.js';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard.js';
import { AdminRbacGuard } from '../../common/guards/admin-rbac.guard.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';

@ApiTags('Admin / Dashboard')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, AdminRbacGuard)
@Controller('api/admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get('stats')
  @RequirePermissions('workspace:view')
  @ApiOperation({ summary: 'Fetch platform-wide aggregated metrics and KPIs' })
  async getStats() {
    return this.adminDashboardService.getPlatformStats();
  }
}
