import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '@notifyiq/config';
import type { RegisterPayload, LoginPayload } from '@notifyiq/schemas';
import { Workspace, WorkspaceDocument } from '../database/schemas/workspace.schema.js';
import { User, UserDocument } from '../database/schemas/user.schema.js';
import { AuditLog, AuditLogDocument } from '../database/schemas/audit-log.schema.js';
import { EmailService } from '../email/email.service.js';
import {
  VerifyEmailDto,
  ResendVerificationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  UpdateProfileDto,
} from './dto/index.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
    private readonly emailService: EmailService,
  ) {}

  async register(
    dto: RegisterPayload,
  ): Promise<{ requiresVerification: boolean; email: string; message: string }> {
    const emailLower = dto.email.toLowerCase().trim();
    const rawPassword = dto.password || dto.passwordLegacy || '';

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email: emailLower });
    if (existingUser) {
      throw new ConflictException('User with this email already registered');
    }

    // 1. Create Workspace
    const slug = dto.workspaceName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const workspace = await this.workspaceModel.create({
      name: dto.workspaceName.trim(),
      slug: slug || `ws-${Date.now()}`,
      plan: 'free',
      currency: 'USD',
      active: true,
      referralSource: dto.referralSource || null,
    });

    // 2. Hash Password and Create Verification Token
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const userName = dto.name || dto.fullName || emailLower.split('@')[0];
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = (await this.userModel.create({
      workspaceId: workspace._id.toString(),
      name: userName,
      email: emailLower,
      passwordHash: hashedPassword,
      role: 'admin',
      isEmailVerified: false,
      emailVerificationToken,
      emailVerificationExpires,
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

    // 4. Send Verification Email via Resend
    this.emailService
      .sendVerificationEmail(user.email, user.name, emailVerificationToken)
      .catch((err) => {
        this.logger.error(`[Auth] Async verification email dispatch error: ${err.message}`);
      });

    return {
      requiresVerification: true,
      email: user.email,
      message: 'Registration successful. Please verify your email using the link sent to your inbox.',
    };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<{
    token: string;
    user: any;
    workspace: any;
    message: string;
  }> {
    const trimmedToken = dto.token.trim();
    if (!trimmedToken) {
      throw new BadRequestException('Verification token is required');
    }

    // Match exact token or matching prefix (for short codes)
    const user = await this.userModel.findOne({
      $or: [
        { emailVerificationToken: trimmedToken },
        { emailVerificationToken: new RegExp(`^${trimmedToken}`, 'i') },
      ],
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token. Please request a new one.');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    const workspace = await this.workspaceModel.findById(user.workspaceId);
    if (!workspace) {
      throw new UnauthorizedException('Workspace not found for user');
    }

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

    this.logger.log(`Email verified successfully for user: ${user.email}`);

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: true,
      },
      workspace: {
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug,
        referralSource: workspace.referralSource,
      },
      message: 'Email verified successfully! Welcome to NotifyIQ.',
    };
  }

  async resendVerification(dto: ResendVerificationDto): Promise<{ success: boolean; message: string }> {
    const emailLower = dto.email.toLowerCase().trim();
    const user = await this.userModel.findOne({ email: emailLower });

    if (!user) {
      // Security standard: generic message prevents email enumeration
      return {
        success: true,
        message: 'If an account exists with this email, a verification link has been resent.',
      };
    }

    if (user.isEmailVerified) {
      return {
        success: true,
        message: 'This email is already verified. You can sign in directly.',
      };
    }

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await this.emailService.sendVerificationEmail(user.email, user.name, emailVerificationToken);

    return {
      success: true,
      message: 'Verification email has been sent. Please check your inbox.',
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ success: boolean; message: string }> {
    const emailLower = dto.email.toLowerCase().trim();
    const user = await this.userModel.findOne({ email: emailLower });

    if (!user) {
      // Security standard: generic message prevents email enumeration
      return {
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      };
    }

    const passwordResetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = passwordResetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    await this.emailService.sendPasswordResetEmail(user.email, user.name, passwordResetToken);

    return {
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ success: boolean; message: string }> {
    const { token, newPassword } = dto;
    if (!token || !newPassword) {
      throw new BadRequestException('Reset token and new password are required');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
    }

    const user = await this.userModel.findOne({
      passwordResetToken: token.trim(),
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset link. Please request a new one.');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.isEmailVerified = true; // Ownership proven via email link
    await user.save();

    this.logger.log(`Password reset successfully for user: ${user.email}`);

    return {
      success: true,
      message: 'Password has been successfully reset. You can now sign in with your new password.',
    };
  }

  async login(dto: LoginPayload): Promise<{ token: string; user: any; workspace: any }> {
    const emailLower = dto.email.toLowerCase().trim();
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

    // 3. Check Email Verification status
    if (user.isEmailVerified === false) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Please verify your email address before logging in.',
        requiresVerification: true,
        email: user.email,
      });
    }

    // 4. Find Workspace
    const workspace = await this.workspaceModel.findById(user.workspaceId);
    if (!workspace) {
      throw new UnauthorizedException('Workspace not found for user');
    }

    // 5. Generate JWT Token
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
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      workspace: {
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug,
        referralSource: workspace.referralSource,
      },
    };
  }

  async getProfile(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const workspace = await this.workspaceModel.findById(user.workspaceId);

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      phone: (user as any).phone || '',
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      createdAt: (user as any).createdAt,
      workspace: workspace
        ? {
            id: workspace._id.toString(),
            name: workspace.name,
            slug: workspace.slug,
            plan: workspace.plan,
            currency: workspace.currency,
          }
        : null,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<any> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.name && dto.name.trim()) {
      user.name = dto.name.trim();
    }
    if (dto.phone !== undefined) {
      (user as any).phone = dto.phone ? dto.phone.trim() : null;
    }

    await user.save();

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      phone: (user as any).phone || '',
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ success: boolean; message: string }> {
    const { currentPassword, newPassword } = dto;
    if (!currentPassword || !newPassword) {
      throw new BadRequestException('Current password and new password are required');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters long');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Current password does not match our records');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    this.logger.log(`Password changed successfully by authenticated user: ${user.email}`);

    return {
      success: true,
      message: 'Password has been changed successfully.',
    };
  }
}
