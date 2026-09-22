import { Controller, Get, Patch, Param, Query, Body, UseGuards, UseInterceptors, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { AdminComplianceService } from './admin-compliance.service.js';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard.js';
import { AdminRbacGuard } from '../../common/guards/admin-rbac.guard.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import { AdminAuditInterceptor } from '../../common/interceptors/admin-audit.interceptor.js';

@ApiTags('Admin / Compliance')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, AdminRbacGuard)
@UseInterceptors(AdminAuditInterceptor)
@Controller('api/admin/compliance')
export class AdminComplianceController {
  constructor(private readonly adminComplianceService: AdminComplianceService) {}

  @Get('erasure-requests')
  @RequirePermissions('compliance:erasure')
  @ApiOperation({ summary: 'GDPR / DPDP data subject erasure request queue with SLA timers' })
  async getErasureRequests() {
    return this.adminComplianceService.getErasureRequests();
  }

  @Patch('erasure-requests/:id/process')
  @RequirePermissions('compliance:erasure')
  @ApiOperation({ summary: 'Execute GDPR / DPDP data purging pipeline' })
  async processErasure(@Param('id') id: string, @Body('reasonCode') reasonCode?: string) {
    return this.adminComplianceService.processErasure(id, reasonCode);
  }

  @Get('audit-log')
  @RequirePermissions('compliance:audit_view')
  @ApiOperation({ summary: 'Cross-workspace searchable audit log records' })
  async getAuditLogs(@Query('entity') entity?: string, @Query('page') page = '1', @Query('limit') limit = '20') {
    return this.adminComplianceService.getAuditLogs(entity, parseInt(page), parseInt(limit));
  }

  @Get('audit-log/export')
  @RequirePermissions('compliance:audit_export')
  @ApiOperation({ summary: 'Export compliance audit log records as CSV' })
  async exportAuditLogs(@Query('entity') entity: string | undefined, @Res() res: Response) {
    const csv = await this.adminComplianceService.exportAuditLogs(entity);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="admin_audit_log_export.csv"');
    return res.send(csv);
  }

  @Get('bsp-readiness')
  @RequirePermissions('compliance:audit_view')
  @ApiOperation({ summary: 'Meta BSP partner status readiness dashboard' })
  async getBspReadiness() {
    return this.adminComplianceService.getBspReadiness();
  }

  @Get('residency')
  @RequirePermissions('compliance:audit_view')
  @ApiOperation({ summary: 'Verify ap-south-1 Indian DPDP data residency status' })
  async getResidencyCheck() {
    return this.adminComplianceService.getResidencyCheck();
  }
}
