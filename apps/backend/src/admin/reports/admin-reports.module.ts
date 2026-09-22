import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';
import { AdminReportsController } from './admin-reports.controller.js';
import { AdminReportsService } from './admin-reports.service.js';
import { AdminAuthModule } from '../auth/admin-auth.module.js';

@Module({
  imports: [DatabaseModule, AdminAuthModule],
  controllers: [AdminReportsController],
  providers: [AdminReportsService],
  exports: [AdminReportsService],
})
export class AdminReportsModule {}
