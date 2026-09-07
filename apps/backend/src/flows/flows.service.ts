import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Flow, FlowDocument } from '../database/schemas/flow.schema.js';

@Injectable()
export class FlowsService {
  constructor(
    @InjectModel(Flow.name) private readonly flowModel: Model<FlowDocument>,
  ) {}

  async createFlow(workspaceId: string, name: string, description: string): Promise<Flow> {
    const defaultNodes = [
      { id: '1', type: 'trigger', data: { label: 'Inbound Webhook Received' }, position: { x: 250, y: 50 } },
      { id: '2', type: 'condition', data: { label: 'Check Sentiment' }, position: { x: 250, y: 150 } },
      { id: '3', type: 'action', data: { label: 'Send WhatsApp template' }, position: { x: 100, y: 280 } },
      { id: '4', type: 'action', data: { label: 'Escalate to Live Agent' }, position: { x: 400, y: 280 } },
    ];

    const defaultEdges = [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3', label: 'positive/neutral' },
      { id: 'e2-4', source: '2', target: '4', label: 'negative/urgent' },
    ];

    return this.flowModel.create({
      workspaceId,
      name,
      description,
      nodes: defaultNodes,
      edges: defaultEdges,
      active: true,
    });
  }

  async getFlows(workspaceId: string): Promise<Flow[]> {
    return this.flowModel.find({ workspaceId });
  }

  async updateFlow(
    workspaceId: string,
    flowId: string,
    dto: { name?: string; description?: string; nodes?: any[]; edges?: any[]; active?: boolean },
  ): Promise<Flow> {
    const flow = await this.flowModel.findOne({ _id: flowId, workspaceId });
    if (!flow) {
      throw new NotFoundException('Flow layout not found');
    }

    if (dto.name !== undefined) flow.name = dto.name;
    if (dto.description !== undefined) flow.description = dto.description;
    if (dto.nodes !== undefined) flow.nodes = dto.nodes;
    if (dto.edges !== undefined) flow.edges = dto.edges;
    if (dto.active !== undefined) flow.active = dto.active;

    await flow.save();
    return flow;
  }
}
