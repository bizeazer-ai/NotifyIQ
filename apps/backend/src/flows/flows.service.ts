import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Flow, FlowDocument } from '../database/schemas/flow.schema.js';

@Injectable()
export class FlowsService {
  constructor(
    @InjectModel(Flow.name) private readonly flowModel: Model<FlowDocument>,
  ) {}

  async createFlow(
    workspaceId: string,
    name: string,
    description: string = '',
    customNodes?: any[],
    customEdges?: any[],
  ): Promise<FlowDocument> {
    const defaultNodes = customNodes || [
      {
        id: '1',
        type: 'trigger',
        data: { label: 'Inbound Customer Message', triggerType: 'any_message' },
        position: { x: 250, y: 50 },
      },
      {
        id: '2',
        type: 'condition',
        data: { label: 'Analyze Sentiment & Intent', conditionType: 'sentiment' },
        position: { x: 250, y: 160 },
      },
      {
        id: '3',
        type: 'send_message',
        data: {
          label: 'Send Welcome Response',
          messageText: 'Hello! Thanks for connecting with NotifyIQ support. How can we help you today?',
        },
        position: { x: 80, y: 300 },
      },
      {
        id: '4',
        type: 'human_handoff',
        data: { label: 'Escalate to Live Inbox Agent', reason: 'Negative sentiment or urgent issue detected' },
        position: { x: 420, y: 300 },
      },
    ];

    const defaultEdges = customEdges || [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3', label: 'positive/neutral' },
      { id: 'e2-4', source: '2', target: '4', label: 'negative/urgent' },
    ];

    // Check if workspace has any existing flows. If first flow, default to active.
    const existingCount = await this.flowModel.countDocuments({ workspaceId });
    const isFirstFlow = existingCount === 0;

    return this.flowModel.create({
      workspaceId,
      name,
      description,
      nodes: defaultNodes,
      edges: defaultEdges,
      active: isFirstFlow,
    });
  }

  async getFlows(workspaceId: string): Promise<FlowDocument[]> {
    return this.flowModel.find({ workspaceId }).sort({ createdAt: -1 });
  }

  async getFlowById(workspaceId: string, flowId: string): Promise<FlowDocument> {
    const flow = await this.flowModel.findOne({ _id: flowId, workspaceId });
    if (!flow) {
      throw new NotFoundException('Automation flow layout not found');
    }
    return flow;
  }

  async updateFlow(
    workspaceId: string,
    flowId: string,
    dto: { name?: string; description?: string; nodes?: any[]; edges?: any[]; active?: boolean; priority?: number },
  ): Promise<FlowDocument> {
    const flow = await this.getFlowById(workspaceId, flowId);

    if (dto.name !== undefined) flow.name = dto.name;
    if (dto.description !== undefined) flow.description = dto.description;
    if (dto.nodes !== undefined) flow.nodes = dto.nodes;
    if (dto.edges !== undefined) flow.edges = dto.edges;
    if (dto.active !== undefined) flow.active = dto.active;
    if (dto.priority !== undefined) flow.priority = dto.priority;

    await flow.save();
    return flow;
  }

  async toggleFlowActive(workspaceId: string, flowId: string, active: boolean): Promise<FlowDocument> {
    const flow = await this.getFlowById(workspaceId, flowId);
    flow.active = active;
    await flow.save();
    return flow;
  }

  async duplicateFlow(workspaceId: string, flowId: string): Promise<FlowDocument> {
    const sourceFlow = await this.getFlowById(workspaceId, flowId);

    return this.flowModel.create({
      workspaceId,
      name: `${sourceFlow.name} (Copy)`,
      description: sourceFlow.description,
      nodes: JSON.parse(JSON.stringify(sourceFlow.nodes)),
      edges: JSON.parse(JSON.stringify(sourceFlow.edges)),
      active: false,
    });
  }

  async deleteFlow(workspaceId: string, flowId: string): Promise<{ deleted: boolean; id: string }> {
    const flow = await this.getFlowById(workspaceId, flowId);
    await this.flowModel.deleteOne({ _id: flow._id });
    return { deleted: true, id: flowId };
  }
}
