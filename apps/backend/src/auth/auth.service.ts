import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '@notifyiq/config';
import type { RegisterPayload, LoginPayload } from '@notifyiq/schemas';
import { Workspace, WorkspaceDocument } from '../database/schemas/workspace.schema.js';
import { User, UserDocument } from '../database/schemas/user.schema.js';
import { AuditLog, AuditLogDocument } from '../database/schemas/audit-log.schema.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async register(dto: RegisterPayload): Promise<{ token: string; user: any; workspace: any }> {
    const emailLower = dto.email.toLowerCase();
    const rawPassword = dto.password || dto.passwordLegacy || '';
    
    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email: emailLower });
    if (existingUser) {
      throw new ConflictException('User with this email already registered');
    }

    // 1. Create Workspace
    const slug = dto.workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const workspace = await this.workspaceModel.create({
      name: dto.workspaceName,
      slug: slug || `ws-${Date.now()}`,
      plan: 'free',
      currency: 'USD',
      active: true,
      referralSource: dto.referralSource || null,
    });

    // 2. Hash Password and Create User
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const userName = dto.name || dto.fullName || emailLower.split('@')[0];
    const user = (await this.userModel.create({
      workspaceId: workspace._id.toString(),
      name: userName,
      email: emailLower,
      passwordHash: hashedPassword,
      role: 'admin',
    })) as any;

    // 3. Append to Audit Log (Referral tracking audits)
    await this.auditLogModel.create({
      workspaceId: workspace._id.toString(),
      userId: user._id.toString(),
      action: 'workspace.register',
      resource: 'Workspace',
      resourceId: workspace._id.toString(),
      details: {
        email: emailLower,
        referralSource: dto.referralSource || 'direct',
      },
    });

    // 4. Generate JWT Authentication Token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        workspaceId: workspace._id.toString(),
        role: user.role,
        email: user.email,
      },
      env.JWT_SECRET || 'fallback-secret-key-notifyiq',
      { expiresIn: '7d' },
    );

    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      workspace: {
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug,
        referralSource: workspace.referralSource,
      },
    };
  }

  async login(dto: LoginPayload): Promise<{ token: string; user: any; workspace: any }> {
    const emailLower = dto.email.toLowerCase();
    const rawPassword = dto.password || dto.passwordLegacy || '';

    // 1. Find User by Email
    const user = await this.userModel.findOne({ email: emailLower });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 2. Validate Password
    const isPasswordValid = await bcrypt.compare(rawPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 3. Find Workspace
    const workspace = await this.workspaceModel.findById(user.workspaceId);
    if (!workspace) {
      throw new UnauthorizedException('Workspace not found for user');
    }

    // 4. Generate JWT Token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        workspaceId: workspace._id.toString(),
        role: user.role,
        email: user.email,
      },
      env.JWT_SECRET || 'fallback-secret-key-notifyiq',
      { expiresIn: '7d' },
    );

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      workspace: {
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug,
        referralSource: workspace.referralSource,
      },
    };
  }
}

