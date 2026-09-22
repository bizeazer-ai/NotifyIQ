import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AiUsageEvent, AiUsageEventDocument } from '../../database/schemas/ai-usage-event.schema.js';
import { Workspace, WorkspaceDocument } from '../../database/schemas/workspace.schema.js';

@Injectable()
export class AdminAiService {
  constructor(
    @InjectModel(AiUsageEvent.name) private aiUsageModel: Model<AiUsageEventDocument>,
    @InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>,
  ) {}

  async getAiCosts() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalCostAgg, featureAgg, modelAgg, topWorkspacesAgg] = await Promise.all([
      this.aiUsageModel.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, totalCost: { $sum: '$estimatedCost' }, totalTokens: { $sum: { $add: ['$promptTokens', '$completionTokens'] } } } },
      ]),
      this.aiUsageModel.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$feature', cost: { $sum: '$estimatedCost' }, count: { $sum: 1 } } },
      ]),
      this.aiUsageModel.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$model', cost: { $sum: '$estimatedCost' }, count: { $sum: 1 } } },
      ]),
      this.aiUsageModel.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$workspaceId', cost: { $sum: '$estimatedCost' }, count: { $sum: 1 } } },
        { $sort: { cost: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const totalCost = totalCostAgg[0]?.totalCost || 0;
    const totalTokens = totalCostAgg[0]?.totalTokens || 0;

    return {
      summary: {
        totalCostUsd: Number(totalCost.toFixed(4)),
        totalTokens,
        activeModelsCount: modelAgg.length,
      },
      featureBreakdown: featureAgg.map((f) => ({
        feature: f._id,
        costUsd: Number(f.cost.toFixed(4)),
        eventCount: f.count,
      })),
      modelBreakdown: modelAgg.map((m) => ({
        model: m._id,
        costUsd: Number(m.cost.toFixed(4)),
        eventCount: m.count,
      })),
      topConsumingWorkspaces: topWorkspacesAgg.map((w) => ({
        workspaceId: w._id,
        costUsd: Number(w.cost.toFixed(4)),
        requestCount: w.count,
      })),
    };
  }

  async setWorkspaceCap(workspaceId: string, monthlyCapUsd: number) {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException(`Workspace ${workspaceId} not found`);
    }

    (workspace as any).aiSettings = {
      ...(workspace.aiSettings || {}),
      monthlyCapUsd,
    };
    await workspace.save();

    return {
      success: true,
      message: `Monthly AI cap for workspace '${workspace.name}' set to $${monthlyCapUsd}`,
    };
  }

  async getFlaggedPrompts(status = 'pending') {
    const filter: Record<string, any> = { flaggedForReview: true };
    if (status !== 'all') {
      filter.actionStatus = status;
    }

    return this.aiUsageModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  async takeFlagAction(eventId: string, actionStatus: 'dismissed' | 'warned' | 'restricted', reasonCode?: string) {
    const event = await this.aiUsageModel.findById(eventId);
    if (!event) {
      throw new NotFoundException(`Flagged AI event ${eventId} not found`);
    }

    event.actionStatus = actionStatus;
    if (reasonCode) {
      event.flagReason = `${event.flagReason || ''} [Action Notes: ${reasonCode}]`;
    }
    await event.save();

    return {
      success: true,
      message: `Flagged AI event action updated to '${actionStatus}'`,
      event,
    };
  }
}
