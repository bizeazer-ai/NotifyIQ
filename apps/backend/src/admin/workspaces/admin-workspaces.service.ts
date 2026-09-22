import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import jwt from 'jsonwebtoken';
import { env } from '@notifyiq/config';
import { Workspace, WorkspaceDocument } from '../../database/schemas/workspace.schema.js';
import { User, UserDocument } from '../../database/schemas/user.schema.js';
import { Message, MessageDocument } from '../../database/schemas/message.schema.js';
import { AuditLog, AuditLogDocument } from '../../database/schemas/audit-log.schema.js';
import { AdminWorkspaceQueryDto } from './dto/workspace-query.dto.js';

@Injectable()
export class AdminWorkspacesService {
  constructor(
    @InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async findAll(query: AdminWorkspaceQueryDto) {
    const { search, status, plan, currency, page = 1, limit = 20 } = query;
    const filter: Record<string, any> = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    if (status !== undefined && status !== '') {
      filter.active = status === 'true' || status === 'active';
    }

    if (plan) {
      filter.plan = plan.toLowerCase();
    }

    if (currency) {
      filter.currency = currency.toUpperCase();
    }

    const skip = (page - 1) * limit;
    const [total, items] = await Promise.all([
      this.workspaceModel.countDocuments(filter),
      this.workspaceModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
    ]);

    // Populate user counts per workspace
    const workspaceIds = items.map((w) => w._id);
    const userCounts = await this.userModel.aggregate([
      { $match: { workspaceId: { $in: workspaceIds } } },
      { $group: { _id: '$workspaceId', count: { $sum: 1 } } },
    ]);

    const userCountMap = new Map(userCounts.map((u) => [u._id.toString(), u.count]));

    const data = items.map((w) => {
      const idStr = (w._id as any).toString();
      return {
        id: idStr,
        name: w.name,
        slug: w.slug,
        type: w.type,
        plan: w.plan,
        active: w.active,
        currency: w.currency,
        memberCount: userCountMap.get(idStr) || 0,
        hasWaba: !!(w.waba && w.waba.phoneNumberId),
        wabaQuality: w.waba?.qualityRating || 'N/A',
        createdAt: (w as any).createdAt,
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const workspace = await this.workspaceModel.findById(id);
    if (!workspace) {
      throw new NotFoundException(`Workspace ${id} not found`);
    }

    const [users, messageCount24h, totalMessages] = await Promise.all([
      this.userModel.find({ workspaceId: id }, { passwordHash: 0 }),
      this.messageModel.countDocuments({
        workspaceId: id,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
      this.messageModel.countDocuments({ workspaceId: id }),
    ]);

    const owner = users.find((u) => u.role === 'admin') || users[0] || null;

    return {
      workspace: {
        id: (workspace._id as any).toString(),
        name: workspace.name,
        slug: workspace.slug,
        type: workspace.type,
        plan: workspace.plan,
        active: workspace.active,
        currency: workspace.currency,
        compliance: workspace.compliance,
        aiSettings: workspace.aiSettings,
        autoReplySettings: workspace.autoReplySettings,
        waba: workspace.waba
          ? {
              phoneNumberId: workspace.waba.phoneNumberId,
              businessAccountId: workspace.waba.businessAccountId,
              qualityRating: workspace.waba.qualityRating || 'GREEN',
              messagingLimit: workspace.waba.messagingLimit || '10K',
              isConnected: !!workspace.waba.accessToken,
            }
          : null,
        whitelabel: workspace.whitelabel,
        createdAt: (workspace as any).createdAt,
        updatedAt: (workspace as any).updatedAt,
      },
      stats: {
        totalMembers: users.length,
        messageCount24h,
        totalMessages,
      },
      owner: owner
        ? {
            id: owner._id,
            name: owner.name,
            email: owner.email,
            role: owner.role,
          }
        : null,
      members: users.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
      })),
    };
  }

  async suspend(id: string, reasonCode?: string) {
    const workspace = await this.workspaceModel.findById(id);
    if (!workspace) {
      throw new NotFoundException(`Workspace ${id} not found`);
    }

    workspace.active = false;
    await workspace.save();

    // Log to tenant audit trail
    await this.auditLogModel.create({
      workspaceId: (workspace._id as any).toString(),
      userId: null,
      action: 'workspace.suspended',
      resource: 'Workspace',
      resourceId: (workspace._id as any).toString(),
      details: { reason: reasonCode || 'Admin administrative suspension' },
    });

    return { success: true, message: `Workspace '${workspace.name}' suspended successfully.` };
  }

  async reactivate(id: string, reasonCode?: string) {
    const workspace = await this.workspaceModel.findById(id);
    if (!workspace) {
      throw new NotFoundException(`Workspace ${id} not found`);
    }

    workspace.active = true;
    await workspace.save();

    // Log to tenant audit trail
    await this.auditLogModel.create({
      workspaceId: (workspace._id as any).toString(),
      userId: null,
      action: 'workspace.reactivated',
      resource: 'Workspace',
      resourceId: (workspace._id as any).toString(),
      details: { reason: reasonCode || 'Admin administrative reactivation' },
    });

    return { success: true, message: `Workspace '${workspace.name}' reactivated successfully.` };
  }

  async hardDelete(id: string, reasonCode?: string) {
    const workspace = await this.workspaceModel.findById(id);
    if (!workspace) {
      throw new NotFoundException(`Workspace ${id} not found`);
    }

    // Schedule 24h cooling off flag
    workspace.compliance.dataErasureRequested = true;
    workspace.active = false;
    await workspace.save();

    return {
      success: true,
      message: `Workspace '${workspace.name}' scheduled for hard deletion within 24 hours.`,
    };
  }

  async impersonate(id: string, adminUser: any, reasonCode?: string) {
    const workspace = await this.workspaceModel.findById(id);
    if (!workspace) {
      throw new NotFoundException(`Workspace ${id} not found`);
    }

    // Find workspace owner or admin user to impersonate
    const owner = await this.userModel.findOne({ workspaceId: id, role: 'admin' });
    const targetUserId = owner ? (owner._id as any).toString() : 'admin_impersonated';
    const targetEmail = owner ? owner.email : `impersonate+${workspace.slug}@notifyiq.app`;

    // Issue time-boxed JWT (30 minutes)
    const impersonationToken = jwt.sign(
      {
        userId: targetUserId,
        workspaceId: (workspace._id as any).toString(),
        role: 'admin',
        email: targetEmail,
        isImpersonated: true,
        impersonatedBy: adminUser.email,
        aud: 'tenant-app',
      },
      env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    // Write to tenant audit log
    await this.auditLogModel.create({
      workspaceId: (workspace._id as any).toString(),
      userId: owner ? (owner._id as any).toString() : null,
      action: 'impersonation.session_started',
      resource: 'Workspace',
      resourceId: (workspace._id as any).toString(),
      details: {
        superAdminId: adminUser.superAdminId,
        superAdminEmail: adminUser.email,
        reason: reasonCode || 'Customer Support Support Ticket Investigation',
      },
    });

    return {
      impersonationToken,
      expiresInMinutes: 30,
      targetWorkspace: {
        id: workspace._id,
        name: workspace.name,
        slug: workspace.slug,
      },
    };
  }

  async getWabaHealth() {
    const workspaces = await this.workspaceModel.find(
      { 'waba.phoneNumberId': { $exists: true, $ne: null } },
      { name: 1, slug: 1, waba: 1, plan: 1 }
    );

    return workspaces.map((w) => ({
      id: (w._id as any).toString(),
      workspaceName: w.name,
      slug: w.slug,
      phoneNumberId: w.waba?.phoneNumberId,
      businessAccountId: w.waba?.businessAccountId,
      qualityRating: w.waba?.qualityRating || 'GREEN',
      messagingLimit: w.waba?.messagingLimit || '10K',
      isConnected: !!w.waba?.accessToken,
    }));
  }

  async getAgencyTree() {
    const agencies = await this.workspaceModel.find({ type: 'agency' });
    const children = await this.workspaceModel.find({ 'whitelabel.parentAgencyId': { $ne: null } });

    const childMap = new Map<string, any[]>();
    children.forEach((c) => {
      const parentId = (c.whitelabel?.parentAgencyId as any)?.toString();
      if (parentId) {
        const list = childMap.get(parentId) || [];
        list.push({
          id: (c._id as any).toString(),
          name: c.name,
          slug: c.slug,
          plan: c.plan,
          active: c.active,
        });
        childMap.set(parentId, list);
      }
    });

    return agencies.map((a) => {
      const aId = (a._id as any).toString();
      return {
        id: aId,
        agencyName: a.name,
        slug: a.slug,
        plan: a.plan,
        active: a.active,
        childWorkspacesCount: childMap.get(aId)?.length || 0,
        children: childMap.get(aId) || [],
      };
    });
  }
}
