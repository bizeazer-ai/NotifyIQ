import { Controller, Get, Post, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminQueuesService } from './admin-queues.service.js';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard.js';
import { AdminRbacGuard } from '../../common/guards/admin-rbac.guard.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import { AdminAuditInterceptor } from '../../common/interceptors/admin-audit.interceptor.js';

@ApiTags('Admin / Queues')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, AdminRbacGuard)
@UseInterceptors(AdminAuditInterceptor)
@Controller('api/admin/queues')
export class AdminQueuesController {
  constructor(private readonly adminQueuesService: AdminQueuesService) {}

  @Get('status')
  @RequirePermissions('system:queue_view')
  @ApiOperation({ summary: 'BullMQ queue metrics and Redis status' })
  async getStatus() {
    return this.adminQueuesService.getQueueStatus();
  }

  @Post('retry')
  @RequirePermissions('system:queue_manage')
  @ApiOperation({ summary: 'Retry failed jobs in a queue' })
  async retryFailed(@Body('queueName') queueName: string) {
    return this.adminQueuesService.retryFailed(queueName);
  }

  @Post('clean')
  @RequirePermissions('system:queue_manage')
  @ApiOperation({ summary: 'Purge completed or failed jobs from a queue' })
  async cleanQueue(@Body('queueName') queueName: string) {
    return this.adminQueuesService.cleanQueue(queueName);
  }
}
