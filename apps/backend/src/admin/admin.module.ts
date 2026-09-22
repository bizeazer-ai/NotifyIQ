import { Module } from '@nestjs/common';
import { AdminAuthModule } from './auth/admin-auth.module.js';
import { AdminDashboardModule } from './dashboard/admin-dashboard.module.js';
import { AdminWorkspacesModule } from './workspaces/admin-workspaces.module.js';
import { AdminBillingModule } from './billing/admin-billing.module.js';
import { AdminAiModule } from './ai/admin-ai.module.js';
import { AdminQueuesModule } from './queues/admin-queues.module.js';
import { AdminInfraModule } from './infra/admin-infra.module.js';
import { AdminComplianceModule } from './compliance/admin-compliance.module.js';
import { AdminSecurityModule } from './security/admin-security.module.js';
import { AdminReportsModule } from './reports/admin-reports.module.js';

@Module({
  imports: [
    AdminAuthModule,
    AdminDashboardModule,
    AdminWorkspacesModule,
    AdminBillingModule,
    AdminAiModule,
    AdminQueuesModule,
    AdminInfraModule,
    AdminComplianceModule,
    AdminSecurityModule,
    AdminReportsModule,
  ],
  exports: [
    AdminAuthModule,
    AdminDashboardModule,
    AdminWorkspacesModule,
    AdminBillingModule,
    AdminAiModule,
    AdminQueuesModule,
    AdminInfraModule,
    AdminComplianceModule,
    AdminSecurityModule,
    AdminReportsModule,
  ],
})
export class AdminModule {}
