import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { FlowsService } from './flows.service.js';
import { AuthGuard, WorkspaceGuard } from '../common/guards/index.js';
import type { AuthenticatedRequest } from '../common/guards/index.js';

class CreateFlowDto {
  name: string;
  description: string;
}

class UpdateFlowDto {
  name?: string;
  description?: string;
  nodes?: any[];
  edges?: any[];
  active?: boolean;
}

@Controller('api/flows')
@UseGuards(AuthGuard, WorkspaceGuard)
export class FlowsController {
  constructor(private readonly flowsService: FlowsService) {}

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateFlowDto,
  ) {
    const workspaceId = req.workspaceId as string;
    const flow = await this.flowsService.createFlow(workspaceId, dto.name, dto.description);
    return {
      message: 'Automation workflow created successfully',
      data: flow,
    };
  }

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    const workspaceId = req.workspaceId as string;
    const flows = await this.flowsService.getFlows(workspaceId);
    return {
      message: 'Automation workflows retrieved successfully',
      data: flows,
    };
  }

  @Put(':flowId')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('flowId') flowId: string,
    @Body() dto: UpdateFlowDto,
  ) {
    const workspaceId = req.workspaceId as string;
    const flow = await this.flowsService.updateFlow(workspaceId, flowId, dto);
    return {
      message: 'Automation workflow updated successfully',
      data: flow,
    };
  }
}
