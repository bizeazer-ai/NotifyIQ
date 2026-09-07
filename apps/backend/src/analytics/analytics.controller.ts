import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';
import { AuthGuard, WorkspaceGuard } from '../common/guards/index.js';
import type { AuthenticatedRequest } from '../common/guards/index.js';

@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async getOverview(@Req() req: AuthenticatedRequest) {
    const workspaceId = req.workspaceId as string;
    const overview = await this.analyticsService.getExecutiveOverview(workspaceId);
    return {
      message: 'Executive analytics overview retrieved successfully',
      data: overview,
    };
  }
}
