import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import jwt from 'jsonwebtoken';
import { env } from '@notifyiq/config';
import { SuperAdmin, SuperAdminDocument } from '../../database/schemas/super-admin.schema.js';

export interface AdminAuthenticatedRequest {
  admin?: {
    superAdminId: string;
    email: string;
    role: string;
    permissions: string[];
  };
  headers: Record<string, string | string[] | undefined>;
  method?: string;
  url?: string;
  path?: string;
  params?: any;
  body?: any;
  [key: string]: any;
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    @InjectModel(SuperAdmin.name) private superAdminModel: Model<SuperAdminDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AdminAuthenticatedRequest>();
    const authHeaderRaw = request.headers['authorization'] || request.headers['Authorization'];

    if (!authHeaderRaw) {
      throw new UnauthorizedException('Admin authorization header missing');
    }

    const authHeader = Array.isArray(authHeaderRaw) ? authHeaderRaw[0] : authHeaderRaw;
    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid admin authorization header format');
    }

    try {
      const secret = (env as any).ADMIN_JWT_SECRET || env.JWT_SECRET;
      const decoded: any = jwt.verify(token, secret);

      // Validate Audience Isolation
      if (decoded.aud !== 'admin-portal') {
        throw new UnauthorizedException('Tenant authentication tokens are not permitted for Admin endpoints');
      }

      // Verify SuperAdmin status in DB
      const admin = await this.superAdminModel.findById(decoded.superAdminId || decoded.sub);
      if (!admin || !admin.isActive) {
        throw new UnauthorizedException('Admin account deactivated or not found');
      }

      if (admin.lockoutUntil && new Date(admin.lockoutUntil) > new Date()) {
        throw new UnauthorizedException('Admin account is temporarily locked out');
      }

      request.admin = {
        superAdminId: (admin._id as any).toString(),
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions || [],
      };

      return true;
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired admin session token');
    }
  }
}
