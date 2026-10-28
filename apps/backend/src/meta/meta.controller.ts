import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { MetaService } from './meta.service.js';
import { ConnectWabaDto, WabaProfileDto, CreateTemplateDto, RegisterPhoneNumberDto } from './dto/index.js';
import { AuthGuard, WorkspaceGuard } from '../common/guards/index.js';
import type { AuthenticatedRequest } from '../common/guards/index.js';


@Controller('api/waba')
export class MetaController {
  constructor(private readonly metaService: MetaService) {}

  @Post('connect')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async connectWaba(
    @Req() req: AuthenticatedRequest,
    @Body() body: Omit<ConnectWabaDto, 'workspaceId'>,
  ) {
    const workspaceId = req.workspaceId as string;
    const userId = req.user?.userId;

    const result = await this.metaService.connectWaba({
      workspaceId,
      accessToken: body.accessToken,
      phoneNumberId: body.phoneNumberId,
      businessAccountId: body.businessAccountId,
    }, userId);

    return {
      message: 'WABA connected and activated successfully',
      ...result,
    };
  }

  @Post('disconnect')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async disconnectWaba(@Req() req: AuthenticatedRequest) {
    const workspaceId = req.workspaceId as string;
    const userId = req.user?.userId;

    const result = await this.metaService.disconnectWaba(workspaceId, userId);
    return {
      message: 'WABA account disconnected successfully',
      data: result,
    };
  }


  @Post('embedded-signup/callback')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async handleEmbeddedSignupCallback(
    @Req() req: AuthenticatedRequest,
    @Body('code') code: string,
  ) {
    const workspaceId = req.workspaceId as string;
    const userId = req.user?.userId;

    const result = await this.metaService.handleEmbeddedSignupCallback(workspaceId, code, userId);
    return {
      message: 'Meta Embedded Signup completed successfully',
      data: result,
    };
  }

  @Get('status')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async getStatus(@Req() req: AuthenticatedRequest) {
    const workspaceId = req.workspaceId as string;
    const status = await this.metaService.getWabaStatus(workspaceId);
    return {
      message: 'WABA status retrieved successfully',
      data: status,
    };
  }

  @Get('phone-numbers')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async getPhoneNumbers(@Req() req: AuthenticatedRequest) {
    const workspaceId = req.workspaceId as string;
    const phoneNumbers = await this.metaService.getPhoneNumbers(workspaceId);
    return {
      message: 'WABA phone numbers retrieved successfully',
      data: phoneNumbers,
    };
  }

  @Post('phone-numbers')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async registerPhoneNumber(
    @Req() req: AuthenticatedRequest,
    @Body() body: RegisterPhoneNumberDto,
  ) {
    const workspaceId = req.workspaceId as string;
    const userId = req.user?.userId;
    const result = await this.metaService.registerPhoneNumber(workspaceId, body, userId);
    return {
      message: 'New WhatsApp phone number registered successfully on Meta API',
      data: result,
    };
  }

  @Delete('phone-numbers/:phoneNumberId')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async deregisterPhoneNumber(
    @Req() req: AuthenticatedRequest,
    @Param('phoneNumberId') phoneNumberId: string,
  ) {
    const workspaceId = req.workspaceId as string;
    const userId = req.user?.userId;
    const result = await this.metaService.deregisterPhoneNumber(workspaceId, phoneNumberId, userId);
    return {
      message: 'WhatsApp phone number deregistered and disconnected from Meta Cloud API',
      data: result,
    };
  }

  @Get('api-logs')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async getApiLogs(@Req() req: AuthenticatedRequest) {
    const workspaceId = req.workspaceId as string;
    const logs = await this.metaService.getMetaApiLogs(workspaceId);
    return {
      message: 'Meta Graph API response logs retrieved successfully',
      data: logs,
    };
  }

  @Post('select-phone-number')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async selectPhoneNumber(
    @Req() req: AuthenticatedRequest,
    @Body('phoneNumberId') phoneNumberId: string,
  ) {
    const workspaceId = req.workspaceId as string;
    const userId = req.user?.userId;
    const result = await this.metaService.selectPhoneNumber(workspaceId, phoneNumberId, userId);
    return {
      message: 'Active WhatsApp phone number switched successfully',
      data: result,
    };
  }

  @Get('profile')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async getProfile(@Req() req: AuthenticatedRequest) {
    const workspaceId = req.workspaceId as string;
    const profile = await this.metaService.getWabaProfile(workspaceId);
    return {
      message: 'WABA profile retrieved successfully',
      data: profile,
    };
  }

  @Post('profile')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() body: WabaProfileDto,
  ) {
    const workspaceId = req.workspaceId as string;
    const result = await this.metaService.updateWabaProfile(workspaceId, body);
    return {
      message: 'WABA profile updated successfully on Meta Cloud API',
      data: result,
    };
  }

  @Get('templates')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async getTemplates(@Req() req: AuthenticatedRequest) {
    const workspaceId = req.workspaceId as string;
    const templates = await this.metaService.getTemplates(workspaceId);
    return {
      message: 'WhatsApp Message Templates retrieved successfully',
      data: templates,
    };
  }

  @Post('templates')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async createTemplate(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateTemplateDto,
  ) {
    const workspaceId = req.workspaceId as string;
    const result = await this.metaService.createTemplate(workspaceId, body);
    return {
      message: 'WhatsApp Message Template submitted for Meta approval successfully',
      data: result,
    };
  }

  @Delete('templates/:name')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async deleteTemplate(
    @Req() req: AuthenticatedRequest,
    @Param('name') name: string,
  ) {
    const workspaceId = req.workspaceId as string;
    const result = await this.metaService.deleteTemplate(workspaceId, name);
    return {
      message: `Template "${name}" deleted successfully`,
      data: result,
    };
  }
}
