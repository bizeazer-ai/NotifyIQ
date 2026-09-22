import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SuperAdmin, SuperAdminDocument } from '../../database/schemas/super-admin.schema.js';
import { AdminAuthenticatedRequest } from './admin-auth.guard.js';

@Injectable()
export class IpAllowlistGuard implements CanActivate {
  constructor(
    @InjectModel(SuperAdmin.name) private superAdminModel: Model<SuperAdminDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AdminAuthenticatedRequest>();
    const admin = request.admin;

    if (!admin) {
      return true; // Checked after AuthGuard
    }

    const dbAdmin = await this.superAdminModel.findById(admin.superAdminId);
    if (!dbAdmin || !dbAdmin.ipAllowList || dbAdmin.ipAllowList.length === 0) {
      return true; // No restriction configured
    }

    const clientIp =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      (request as any).socket?.remoteAddress ||
      '127.0.0.1';

    const isAllowed = dbAdmin.ipAllowList.some((allowedIp) => {
      if (allowedIp === clientIp) return true;
      if (allowedIp === '*' || allowedIp === '0.0.0.0/0') return true;
      return false;
    });

    if (!isAllowed) {
      throw new ForbiddenException(`Access denied: IP address ${clientIp} is not in your allow-list`);
    }

    return true;
  }
}
