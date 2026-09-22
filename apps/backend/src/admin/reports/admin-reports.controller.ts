import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminReportsService } from './admin-reports.service.js';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard.js';
import { AdminRbacGuard } from '../../common/guards/admin-rbac.guard.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';

@ApiTags('Admin / Reports')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, AdminRbacGuard)
@Controller('api/admin/reports')
export class AdminReportsController {
  constructor(private readonly adminReportsService: AdminReportsService) {}

  @Get('summary')
  @RequirePermissions('compliance:audit_view')
  @ApiOperation({ summary: 'Generate scheduled executive platform KPI summary report' })
  async generateExecutiveSummary() {
    return this.adminReportsService.generateExecutiveSummary();
  }
}
