import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator.js';
import { AdminAuthenticatedRequest } from './admin-auth.guard.js';

export const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  platform_owner: ['*'], // Wildcard access
  platform_admin: [
    'workspace:view', 'workspace:suspend', 'workspace:reactivate', 'workspace:override_quota',
    'billing:view', 'billing:invoice', 'billing:credits',
    'ai:view', 'ai:set_caps', 'ai:review_flags',
    'system:queue_view', 'system:queue_manage', 'system:infra_view',
    'compliance:audit_view', 'admin:security_center',
  ],
  support_agent: [
    'workspace:view', 'workspace:impersonate',
    'billing:view',
    'ai:view',
    'system:queue_view',
  ],
  billing_ops: [
    'workspace:view',
    'billing:view', 'billing:refund', 'billing:invoice', 'billing:credits',
  ],
  compliance_officer: [
    'workspace:view',
    'compliance:erasure', 'compliance:audit_view', 'compliance:audit_export',
    'admin:security_center',
  ],
  read_only_auditor: [
    'workspace:view', 'billing:view', 'ai:view', 'system:queue_view', 'compliance:audit_view',
  ],
};

@Injectable()
export class AdminRbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No specific permission required
    }

    const request = context.switchToHttp().getRequest<AdminAuthenticatedRequest>();
    const admin = request.admin;

    if (!admin) {
      throw new ForbiddenException('Access denied: Admin credentials missing');
    }

    // Platform Owner has full access
    if (admin.role === 'platform_owner' || admin.permissions.includes('*')) {
      return true;
    }

    // Role default permissions combined with individual permissions
    const roleDefaults = ROLE_DEFAULT_PERMISSIONS[admin.role] || [];
    const effectivePermissions = new Set([...roleDefaults, ...admin.permissions]);

    // Check if admin has ALL required permissions
    const hasPermission = requiredPermissions.every((perm) => effectivePermissions.has(perm));

    if (!hasPermission) {
      throw new ForbiddenException(`Access denied: Missing required permission [${requiredPermissions.join(', ')}]`);
    }

    return true;
  }
}
