import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminWorkspacesService } from './admin-workspaces.service.js';
import { AdminWorkspaceQueryDto } from './dto/workspace-query.dto.js';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard.js';
import { AdminRbacGuard } from '../../common/guards/admin-rbac.guard.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import { AdminAuditInterceptor } from '../../common/interceptors/admin-audit.interceptor.js';

@ApiTags('Admin / Workspaces')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, AdminRbacGuard)
@UseInterceptors(AdminAuditInterceptor)
@Controller('api/admin/workspaces')
export class AdminWorkspacesController {
  constructor(private readonly adminWorkspacesService: AdminWorkspacesService) {}

  @Get()
  @RequirePermissions('workspace:view')
  @ApiOperation({ summary: 'Paginated search & list of tenant workspaces' })
  async findAll(@Query() query: AdminWorkspaceQueryDto) {
    return this.adminWorkspacesService.findAll(query);
  }

  @Get('waba-health')
  @RequirePermissions('workspace:view')
  @ApiOperation({ summary: 'Meta WABA connection health across all workspaces' })
  async getWabaHealth() {
    return this.adminWorkspacesService.getWabaHealth();
  }

  @Get('agency-tree')
  @RequirePermissions('workspace:view')
  @ApiOperation({ summary: 'Agency parent-child workspace hierarchy tree' })
  async getAgencyTree() {
    return this.adminWorkspacesService.getAgencyTree();
  }

  @Get(':id')
  @RequirePermissions('workspace:view')
  @ApiOperation({ summary: '360-degree profile of a single tenant workspace' })
  async findOne(@Param('id') id: string) {
    return this.adminWorkspacesService.findOne(id);
  }

  @Patch(':id/suspend')
  @RequirePermissions('workspace:suspend')
  @ApiOperation({ summary: 'Suspend a tenant workspace' })
  async suspend(@Param('id') id: string, @Body('reasonCode') reasonCode?: string) {
    return this.adminWorkspacesService.suspend(id, reasonCode);
  }

  @Patch(':id/reactivate')
  @RequirePermissions('workspace:reactivate')
  @ApiOperation({ summary: 'Reactivate a suspended workspace' })
  async reactivate(@Param('id') id: string, @Body('reasonCode') reasonCode?: string) {
    return this.adminWorkspacesService.reactivate(id, reasonCode);
  }

  @Delete(':id')
  @RequirePermissions('workspace:delete')
  @ApiOperation({ summary: 'Initiate 24h cooling-off hard deletion of a workspace' })
  async hardDelete(@Param('id') id: string, @Body('reasonCode') reasonCode?: string) {
    return this.adminWorkspacesService.hardDelete(id, reasonCode);
  }

  @Post(':id/impersonate')
  @RequirePermissions('workspace:impersonate')
  @ApiOperation({ summary: 'Generate time-boxed impersonation token to log in as workspace agent' })
  async impersonate(@Param('id') id: string, @Req() req: any, @Body('reasonCode') reasonCode?: string) {
    return this.adminWorkspacesService.impersonate(id, req.admin, reasonCode);
  }
}
