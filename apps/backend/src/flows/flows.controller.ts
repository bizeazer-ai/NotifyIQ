import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { FlowsService } from './flows.service.js';
import { FlowExecutionEngine } from './flow-execution.engine.js';
import { CreateFlowDto, UpdateFlowDto, ToggleActiveDto, TestSimulationDto } from './dto/index.js';
import { AuthGuard, WorkspaceGuard } from '../common/guards/index.js';
import type { AuthenticatedRequest } from '../common/guards/index.js';

@Controller('api/flows')
@UseGuards(AuthGuard, WorkspaceGuard)
export class FlowsController {
  constructor(
    private readonly flowsService: FlowsService,
    private readonly flowExecutionEngine: FlowExecutionEngine,
  ) {}

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateFlowDto,
  ) {
    const workspaceId = req.workspaceId as string;
    const flow = await this.flowsService.createFlow(
      workspaceId,
      dto.name,
      dto.description || '',
      dto.nodes,
      dto.edges,
    );
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

  @Get(':flowId')
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param('flowId') flowId: string,
  ) {
    const workspaceId = req.workspaceId as string;
    const flow = await this.flowsService.getFlowById(workspaceId, flowId);
    return {
      message: 'Automation workflow details retrieved successfully',
      data: flow,
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

  @Patch(':flowId/toggle')
  async toggleActive(
    @Req() req: AuthenticatedRequest,
    @Param('flowId') flowId: string,
    @Body() dto: ToggleActiveDto,
  ) {
    const workspaceId = req.workspaceId as string;
    const flow = await this.flowsService.toggleFlowActive(workspaceId, flowId, dto.active);
    return {
      message: `Automation workflow ${dto.active ? 'activated' : 'deactivated'} successfully`,
      data: flow,
    };
  }

  @Post(':flowId/duplicate')
  async duplicate(
    @Req() req: AuthenticatedRequest,
    @Param('flowId') flowId: string,
  ) {
    const workspaceId = req.workspaceId as string;
    const flow = await this.flowsService.duplicateFlow(workspaceId, flowId);
    return {
      message: 'Automation workflow duplicated successfully',
      data: flow,
    };
  }

  @Delete(':flowId')
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('flowId') flowId: string,
  ) {
    const workspaceId = req.workspaceId as string;
    const result = await this.flowsService.deleteFlow(workspaceId, flowId);
    return {
      message: 'Automation workflow deleted successfully',
      data: result,
    };
  }

  @Post('test-simulation')
  async testSimulation(
    @Req() req: AuthenticatedRequest,
    @Body() dto: TestSimulationDto,
  ) {
    const workspaceId = req.workspaceId as string;
    const dummyConversation: any = { _id: '507f1f77bcf86cd799439011', sentiment: dto.sentiment || 'neutral', save: async () => {} };
    const dummyContact: any = { _id: '507f1f77bcf86cd799439022', tags: [], save: async () => {} };


    const result = await this.flowExecutionEngine.executeFlowForInboundMessage(
      workspaceId,
      dummyConversation,
      dummyContact,
      dto.inputMessage || 'Hello test simulation',
      dto.sentiment || 'neutral',
    );

    return {
      message: 'Flow simulation completed',
      data: result,
    };
  }
}
