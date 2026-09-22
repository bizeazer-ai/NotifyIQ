import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminAiService } from './admin-ai.service.js';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard.js';
import { AdminRbacGuard } from '../../common/guards/admin-rbac.guard.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import { AdminAuditInterceptor } from '../../common/interceptors/admin-audit.interceptor.js';

@ApiTags('Admin / AI Ops')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, AdminRbacGuard)
@UseInterceptors(AdminAuditInterceptor)
@Controller('api/admin/ai')
export class AdminAiController {
  constructor(private readonly adminAiService: AdminAiService) {}

  @Get('costs')
  @RequirePermissions('ai:view')
  @ApiOperation({ summary: 'AI costs and token usage aggregated by feature and model' })
  async getAiCosts() {
    return this.adminAiService.getAiCosts();
  }

  @Patch('caps/:workspaceId')
  @RequirePermissions('ai:set_caps')
  @ApiOperation({ summary: 'Configure monthly AI spend cap for a workspace' })
  async setWorkspaceCap(@Param('workspaceId') workspaceId: string, @Body('monthlyCapUsd') monthlyCapUsd: number) {
    return this.adminAiService.setWorkspaceCap(workspaceId, monthlyCapUsd);
  }

  @Get('flagged')
  @RequirePermissions('ai:review_flags')
  @ApiOperation({ summary: 'Prompt-injection and toxic output review queue' })
  async getFlaggedPrompts(@Query('status') status = 'pending') {
    return this.adminAiService.getFlaggedPrompts(status);
  }

  @Patch('flagged/:id/action')
  @RequirePermissions('ai:review_flags')
  @ApiOperation({ summary: 'Dismiss, warn, or restrict flagged prompt event' })
  async takeFlagAction(
    @Param('id') id: string,
    @Body('actionStatus') actionStatus: 'dismissed' | 'warned' | 'restricted',
    @Body('reasonCode') reasonCode?: string
  ) {
    return this.adminAiService.takeFlagAction(id, actionStatus, reasonCode);
  }
}
