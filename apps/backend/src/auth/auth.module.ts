import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { EmailModule } from '../email/email.module.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';

@Module({
  imports: [DatabaseModule, EmailModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
