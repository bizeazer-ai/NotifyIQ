import { Controller, Get, Put, Patch, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service.js';
import { UpdateBrandingDto, UpdateAutoReplyDto, VerifyDomainDto } from './dto/index.js';
import { AuthGuard, WorkspaceGuard } from '../common/guards/index.js';
import type { AuthenticatedRequest } from '../common/guards/index.js';

@Controller('api/workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get('auto-reply')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async getAutoReply(@Req() req: AuthenticatedRequest) {
    const workspaceId = req.workspaceId as string;
    const settings = await this.workspacesService.getAutoReplySettings(workspaceId);
    return {
      message: 'Workspace auto-reply settings retrieved successfully',
      data: settings,
    };
  }

  @Patch('auto-reply')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async updateAutoReply(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateAutoReplyDto,
  ) {
    const workspaceId = req.workspaceId as string;
    const settings = await this.workspacesService.updateAutoReplySettings(workspaceId, dto);
    return {
      message: 'Workspace auto-reply settings updated successfully',
      data: settings,
    };
  }

  @Put('whitelabel')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async updateBranding(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateBrandingDto,
  ) {
    const workspaceId = req.workspaceId as string;
    const workspace = await this.workspacesService.updateWhitelabelBranding(workspaceId, dto);
    return {
      message: 'Whitelabel branding settings updated successfully',
      data: {
        logoUrl: workspace.whitelabel?.logoUrl,
        brandColor: workspace.whitelabel?.brandColor,
        customCss: workspace.whitelabel?.customCss,
        customDomain: workspace.whitelabel?.customDomain,
      },
    };
  }

  @Get('whitelabel/settings')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async getBrandingSettings(@Req() req: AuthenticatedRequest) {
    const workspaceId = req.workspaceId as string;
    const branding = await this.workspacesService.resolveBranding(workspaceId);
    return {
      message: 'Branding settings resolved successfully',
      data: branding,
    };
  }

  @Post('verify-domain')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async verifyDomain(
    @Req() req: AuthenticatedRequest,
    @Body() dto: VerifyDomainDto,
  ) {
    const workspaceId = req.workspaceId as string;
    const result = await this.workspacesService.verifyCustomDomainCname(workspaceId, dto.domain);
    return {
      message: 'Custom CNAME domain mapping validated successfully',
      data: result,
    };
  }

  @Get('resolve-domain/:domain')
  async resolveByDomain(@Param('domain') domain: string) {
    const data = await this.workspacesService.resolveByDomain(domain);
    return {
      message: 'Domain workspace mapped successfully',
      data,
    };
  }
}
