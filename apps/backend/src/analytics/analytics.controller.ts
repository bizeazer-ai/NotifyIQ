import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';
import { AuthGuard, WorkspaceGuard } from '../common/guards/index.js';
import type { AuthenticatedRequest } from '../common/guards/index.js';

@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async getOverview(@Req() req: AuthenticatedRequest, @Query('days') days?: string) {
    const workspaceId = req.workspaceId as string;
    const daysNum = days ? parseInt(days, 10) || 7 : 7;
    const overview = await this.analyticsService.getExecutiveOverview(workspaceId, daysNum);
    return {
      message: 'Executive analytics overview retrieved successfully',
      data: overview,
    };
  }
}

