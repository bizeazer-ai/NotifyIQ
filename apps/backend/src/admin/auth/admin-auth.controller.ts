import { Controller, Post, Body, Req, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminAuthService } from './admin-auth.service.js';
import { AdminLoginDto } from './dto/admin-login.dto.js';
import { Verify2FaDto } from './dto/verify-2fa.dto.js';

@ApiTags('Admin / Auth')
@Controller('api/admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Initiate SuperAdmin login (Step 1)' })
  @ApiResponse({ status: 200, description: 'Credentials verified, returns 2FA challenge token' })
  async login(@Body() dto: AdminLoginDto, @Req() req: any) {
    const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.adminAuthService.login(dto, clientIp, userAgent);
  }

  @Post('verify-2fa')
  @ApiOperation({ summary: 'Verify 2FA TOTP code (Step 2)' })
  @ApiResponse({ status: 200, description: '2FA verified, returns Admin Access JWT' })
  async verify2FA(@Body() dto: Verify2FaDto, @Req() req: any) {
    const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.adminAuthService.verify2FA(dto, clientIp, userAgent);
  }

  @Post('setup-2fa')
  @ApiOperation({ summary: 'Generate 2FA TOTP secret and QR code for SuperAdmin' })
  async setup2FA(@Body('challengeToken') challengeToken: string) {
    return this.adminAuthService.setup2FA(challengeToken);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Invalidate active admin session' })
  async logout(@Headers('authorization') authHeader: string) {
    return this.adminAuthService.logout(authHeader);
  }
}
