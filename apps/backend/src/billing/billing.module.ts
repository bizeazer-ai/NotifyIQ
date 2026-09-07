import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { BillingController } from './billing.controller.js';
import { WhmcsController } from './whmcs.controller.js';
import { BillingService } from './billing.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [BillingController, WhmcsController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
