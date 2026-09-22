import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';
import { AdminInfraController } from './admin-infra.controller.js';
import { AdminInfraService } from './admin-infra.service.js';
import { AdminAuthModule } from '../auth/admin-auth.module.js';

@Module({
  imports: [DatabaseModule, AdminAuthModule],
  controllers: [AdminInfraController],
  providers: [AdminInfraService],
  exports: [AdminInfraService],
})
export class AdminInfraModule {}
