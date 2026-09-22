import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminBillingService } from './admin-billing.service.js';
import { CreateCouponDto } from './dto/create-coupon.dto.js';
import { ProcessRefundDto } from './dto/process-refund.dto.js';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard.js';
import { AdminRbacGuard } from '../../common/guards/admin-rbac.guard.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import { AdminAuditInterceptor } from '../../common/interceptors/admin-audit.interceptor.js';

@ApiTags('Admin / Billing')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, AdminRbacGuard)
@UseInterceptors(AdminAuditInterceptor)
@Controller('api/admin/billing')
export class AdminBillingController {
  constructor(private readonly adminBillingService: AdminBillingService) {}

  @Get('overview')
  @RequirePermissions('billing:view')
  @ApiOperation({ summary: 'Financial overview across Razorpay & Stripe payment rails' })
  async getOverview() {
    return this.adminBillingService.getBillingOverview();
  }

  @Get('invoices')
  @RequirePermissions('billing:view')
  @ApiOperation({ summary: 'Cross-workspace invoice lookup and transaction search' })
  async getInvoices(
    @Query('gateway') gateway?: string,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20'
  ) {
    return this.adminBillingService.getInvoices(gateway, status, parseInt(page), parseInt(limit));
  }

  @Post('refund')
  @RequirePermissions('billing:refund')
  @ApiOperation({ summary: 'Process partial or full refund with mandatory audit reason' })
  async processRefund(@Body() dto: ProcessRefundDto, @Req() req: any) {
    return this.adminBillingService.processRefund(dto, req.admin);
  }

  @Get('analytics')
  @RequirePermissions('billing:view')
  @ApiOperation({ summary: 'Detailed revenue analytics (MRR, ARR, ARPU, conversion rate)' })
  async getAnalytics() {
    return this.adminBillingService.getRevenueAnalytics();
  }

  @Get('coupons')
  @RequirePermissions('billing:view')
  @ApiOperation({ summary: 'List promotional coupons and discount codes' })
  async listCoupons() {
    return this.adminBillingService.listCoupons();
  }

  @Post('coupons')
  @RequirePermissions('billing:credits')
  @ApiOperation({ summary: 'Create new promotional coupon or credit code' })
  async createCoupon(@Body() dto: CreateCouponDto) {
    return this.adminBillingService.createCoupon(dto);
  }

  @Patch('coupons/:id/toggle')
  @RequirePermissions('billing:credits')
  @ApiOperation({ summary: 'Activate or deactivate a promotional coupon code' })
  async toggleCoupon(@Param('id') id: string) {
    return this.adminBillingService.toggleCoupon(id);
  }
}
