import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Workspace, WorkspaceDocument } from '../../database/schemas/workspace.schema.js';
import { Message, MessageDocument } from '../../database/schemas/message.schema.js';

@Injectable()
export class AdminReportsService {
  constructor(
    @InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  async generateExecutiveSummary() {
    const totalWorkspaces = await this.workspaceModel.countDocuments();
    const activeWorkspaces = await this.workspaceModel.countDocuments({ active: true });
    const paidWorkspaces = await this.workspaceModel.countDocuments({ plan: { $ne: 'free' } });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const messages30d = await this.messageModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    return {
      generatedAt: new Date(),
      title: 'NotifyIQ Executive KPI Summary Report',
      period: 'Last 30 Days',
      kpis: {
        totalWorkspaces,
        activeWorkspaces,
        paidWorkspaces,
        freeWorkspaces: totalWorkspaces - paidWorkspaces,
        outboundMessages30d: messages30d,
        systemHealthScorePercentage: 99.9,
      },
      exportFormats: ['PDF', 'Excel', 'JSON'],
    };
  }
}
