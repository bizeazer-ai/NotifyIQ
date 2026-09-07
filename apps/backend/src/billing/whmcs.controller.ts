import { Controller, Post, Body, UseGuards, BadRequestException, NotFoundException, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '@notifyiq/config';
import { ApiKeyGuard } from '../common/guards/api-key.guard.js';
import { Workspace, WorkspaceDocument } from '../database/schemas/workspace.schema.js';
import { User, UserDocument } from '../database/schemas/user.schema.js';
import { AuditLog, AuditLogDocument } from '../database/schemas/audit-log.schema.js';

class ProvisionWorkspaceDto {
  workspaceName: string;
  adminEmail: string;
  plan?: string;
  parentAgencyId?: string;
}

class ActionWorkspaceDto {
  workspaceId: string;
}

@Controller('api/partner/whmcs')
@UseGuards(ApiKeyGuard)
export class WhmcsController {
  constructor(
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  /**
   * Provisions a new Workspace & Admin User when ordered via WHMCS
   */
  @Post('provision')
  @HttpCode(HttpStatus.CREATED)
  async provision(@Body() dto: ProvisionWorkspaceDto) {
    console.log(`[WHMCS] Provisioning request received for email: ${dto.adminEmail}`);

    const emailLower = dto.adminEmail.toLowerCase();
    
    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email: emailLower });
    if (existingUser) {
      throw new BadRequestException('User with this email already registered');
    }

    // 1. Create Workspace
    const slug = dto.workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const workspace = await this.workspaceModel.create({
      name: dto.workspaceName,
      slug: slug || `ws-${Date.now()}`,
      plan: dto.plan || 'growth', // default to Growth when provisioned by WHMCS
      currency: 'USD',
      active: true,
      whitelabel: dto.parentAgencyId ? {
        parentAgencyId: dto.parentAgencyId,
      } : null,
    });

    // 2. Generate a random temporary password for the admin user
    const tempPassword = `Pass_${Math.random().toString(36).substring(2, 10)}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = (await this.userModel.create({
      workspaceId: workspace._id.toString(),
      email: emailLower,
      passwordHash: hashedPassword,
      role: 'admin',
    })) as any;

    // 3. Append to Audit Log
    await this.auditLogModel.create({
      workspaceId: workspace._id.toString(),
      userId: user._id.toString(),
      action: 'whmcs.provision',
      resource: 'Workspace',
      resourceId: workspace._id.toString(),
      details: {
        email: emailLower,
        plan: workspace.plan,
        parentAgencyId: dto.parentAgencyId || 'none',
        provisioner: 'WHMCS Module',
      },
    });

    return {
      message: 'Workspace provisioned successfully via WHMCS',
      data: {
        workspaceId: workspace._id,
        workspaceName: workspace.name,
        adminEmail: user.email,
        temporaryPassword: tempPassword,
        loginUrl: `${env.UTHO_ENDPOINT ? 'https://' : 'http://localhost:5173/'}login`,
      },
    };
  }

  /**
   * Suspends a Workspace when overdue in WHMCS
   */
  @Post('suspend')
  @HttpCode(HttpStatus.OK)
  async suspend(@Body() dto: ActionWorkspaceDto) {
    console.log(`[WHMCS] Suspending workspace: ${dto.workspaceId}`);

    const workspace = await this.workspaceModel.findById(dto.workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    workspace.active = false;
    await workspace.save();

    await this.auditLogModel.create({
      workspaceId: workspace._id.toString(),
      action: 'whmcs.suspend',
      resource: 'Workspace',
      resourceId: workspace._id.toString(),
      details: {
        reason: 'Overdue invoice payment suspension in WHMCS',
      },
    });

    return {
      message: 'Workspace suspended successfully',
      data: { workspaceId: workspace._id, active: workspace.active },
    };
  }

  /**
   * Unsuspends/Re-activates a Workspace when paid in WHMCS
   */
  @Post('unsuspend')
  @HttpCode(HttpStatus.OK)
  async unsuspend(@Body() dto: ActionWorkspaceDto) {
    console.log(`[WHMCS] Unsuspended workspace: ${dto.workspaceId}`);

    const workspace = await this.workspaceModel.findById(dto.workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    workspace.active = true;
    await workspace.save();

    await this.auditLogModel.create({
      workspaceId: workspace._id.toString(),
      action: 'whmcs.unsuspend',
      resource: 'Workspace',
      resourceId: workspace._id.toString(),
      details: {
        reason: 'Invoice payment received in WHMCS',
      },
    });

    return {
      message: 'Workspace re-activated successfully',
      data: { workspaceId: workspace._id, active: workspace.active },
    };
  }
}
