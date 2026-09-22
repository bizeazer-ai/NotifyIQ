import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Observable, tap } from 'rxjs';
import { AdminAuditLog, AdminAuditLogDocument } from '../../database/schemas/admin-audit-log.schema.js';
import { AdminAuthenticatedRequest } from '../guards/admin-auth.guard.js';

@Injectable()
export class AdminAuditInterceptor implements NestInterceptor {
  constructor(
    @InjectModel(AdminAuditLog.name) private auditLogModel: Model<AdminAuditLogDocument>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<AdminAuthenticatedRequest>();
    const method = request.method || 'GET';

    // Only audit mutating requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next.handle();
    }

    const admin = request.admin;
    if (!admin) {
      return next.handle();
    }

    const path = request.url || request.path || '';
    const body: Record<string, any> = request.body || {};
    const params: Record<string, any> = request.params || {};

    const reasonCode = body.reasonCode || (request.headers['x-reason-code'] as string) || null;

    const rawIp = request.headers['x-forwarded-for'];
    const clientIp = Array.isArray(rawIp) ? rawIp[0] : rawIp?.split(',')[0].trim() || null;
    const userAgent = (request.headers['user-agent'] as string) || null;

    return next.handle().pipe(
      tap(async (responseBody) => {
        try {
          await this.auditLogModel.create({
            superAdminId: admin.superAdminId,
            adminEmail: admin.email,
            role: admin.role,
            action: `${method} ${path}`,
            targetEntity: this.extractEntity(path),
            targetId: params.id || body.id || null,
            beforeSnapshot: body,
            afterSnapshot: typeof responseBody === 'object' ? responseBody : { result: 'success' },
            ipAddress: clientIp,
            userAgent,
            reasonCode,
          });
        } catch (err) {
          // Log auditing error silently so business action completes
          console.error('Failed to record Admin Audit Log:', err);
        }
      }),
    );
  }

  private extractEntity(path: string): string {
    const parts = path.replace('/api/admin/', '').split('/');
    return parts[0] ? parts[0].toUpperCase() : 'UNKNOWN';
  }
}
