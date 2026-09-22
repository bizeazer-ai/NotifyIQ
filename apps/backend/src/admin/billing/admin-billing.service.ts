import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import { env } from '@notifyiq/config';
import { Workspace, WorkspaceDocument } from '../../database/schemas/workspace.schema.js';
import { AuditLog, AuditLogDocument } from '../../database/schemas/audit-log.schema.js';
import { Coupon, CouponDocument } from '../../database/schemas/coupon.schema.js';
import { CreateCouponDto } from './dto/create-coupon.dto.js';
import { ProcessRefundDto } from './dto/process-refund.dto.js';

@Injectable()
export class AdminBillingService {
  constructor(
    @InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
  ) {}

  async getBillingOverview() {
    const totalWorkspaces = await this.workspaceModel.countDocuments();
    const payingWorkspaces = await this.workspaceModel.countDocuments({ plan: { $ne: 'free' } });

    const [inrWorkspaces, usdWorkspaces] = await Promise.all([
      this.workspaceModel.find({ currency: 'INR', plan: { $ne: 'free' } }),
      this.workspaceModel.find({ currency: { $in: ['USD', 'EUR'] }, plan: { $ne: 'free' } }),
    ]);

    const planPricesInr: Record<string, number> = { growth: 3999, enterprise: 14999 };
    const planPricesUsd: Record<string, number> = { growth: 49, enterprise: 199 };

    let mrrInr = 0;
    inrWorkspaces.forEach((w) => {
      mrrInr += planPricesInr[w.plan] || 3999;
    });

    let mrrUsd = 0;
    usdWorkspaces.forEach((w) => {
      mrrUsd += planPricesUsd[w.plan] || 49;
    });

    // Fetch recent 10 billing log entries
    const recentTransactions = await this.auditLogModel
      .find({ action: { $regex: /^billing\./ } })
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();

    return {
      metrics: {
        totalWorkspaces,
        payingWorkspaces,
        freeWorkspaces: totalWorkspaces - payingWorkspaces,
        mrr: {
          inr: mrrInr,
          usd: mrrUsd,
          reconciledUsdTotal: Math.round(mrrUsd + mrrInr / 85),
        },
      },
      recentTransactions: recentTransactions.map((t) => ({
        id: t._id,
        workspaceId: t.workspaceId,
        action: t.action,
        details: t.details,
        createdAt: (t as any).createdAt,
      })),
    };
  }

  async getInvoices(gateway?: string, status?: string, page = 1, limit = 20) {
    const filter: Record<string, any> = { action: { $regex: /^billing\./ } };

    if (gateway) {
      filter['details.paymentGateway'] = new RegExp(`^${gateway}$`, 'i');
    }

    if (status === 'success') {
      filter.action = 'billing.payment_succeeded';
    } else if (status === 'failed') {
      filter.action = 'billing.payment_failed';
    }

    const skip = (page - 1) * limit;
    const [total, logs] = await Promise.all([
      this.auditLogModel.countDocuments(filter),
      this.auditLogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
    ]);

    return {
      data: logs.map((log) => ({
        id: log._id,
        workspaceId: log.workspaceId,
        action: log.action,
        gateway: log.details?.paymentGateway || 'Unknown',
        amount: log.details?.amount || 0,
        currency: log.details?.currency || 'INR',
        plan: log.details?.plan || 'N/A',
        notes: log.details?.notes || '',
        createdAt: (log as any).createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async processRefund(dto: ProcessRefundDto, adminUser: any) {
    const workspace = await this.workspaceModel.findById(dto.workspaceId);
    if (!workspace) {
      throw new NotFoundException(`Workspace ${dto.workspaceId} not found`);
    }

    let refundResult: any;
    const isMock = process.env.MOCK_SERVICES === 'true';

    if (dto.paymentGateway === 'Stripe') {
      const apiKey = env.STRIPE_API_KEY;
      if (isMock || !apiKey) {
        refundResult = { refundId: `re_mock_${Date.now()}`, status: 'succeeded' };
      } else {
        const stripe = new Stripe(apiKey, { apiVersion: '2025-01-27.acacia' as any });
        refundResult = await stripe.refunds.create({
          charge: dto.transactionId,
          amount: Math.round(dto.amount * 100), // in cents
          reason: 'requested_by_customer',
        });
      }
    } else {
      // Razorpay
      const keyId = env.RAZORPAY_KEY_ID;
      const keySecret = env.RAZORPAY_KEY_SECRET;
      if (isMock || !keyId || !keySecret) {
        refundResult = { refundId: `rfnd_mock_${Date.now()}`, status: 'processed' };
      } else {
        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
        refundResult = await razorpay.payments.refund(dto.transactionId, {
          amount: Math.round(dto.amount * 100), // in paise
          notes: { reason: dto.reasonCode, adminEmail: adminUser.email },
        });
      }
    }

    // Record in tenant audit trail
    await this.auditLogModel.create({
      workspaceId: (workspace._id as any).toString(),
      action: 'billing.refund_issued',
      resource: 'Billing',
      resourceId: dto.transactionId,
      details: {
        paymentGateway: dto.paymentGateway,
        amount: dto.amount,
        reasonCode: dto.reasonCode,
        adminEmail: adminUser.email,
        refundResult,
      },
    });

    return {
      success: true,
      message: `Refund of ${dto.amount} successfully processed via ${dto.paymentGateway}`,
      refundResult,
    };
  }

  async getRevenueAnalytics() {
    const workspaces = await this.workspaceModel.find({}, { plan: 1, currency: 1, active: 1 });

    const planCounts: Record<string, number> = { free: 0, growth: 0, enterprise: 0 };
    const currencyCounts: Record<string, number> = { INR: 0, USD: 0, EUR: 0 };

    workspaces.forEach((w) => {
      planCounts[w.plan] = (planCounts[w.plan] || 0) + 1;
      currencyCounts[w.currency] = (currencyCounts[w.currency] || 0) + 1;
    });

    const totalPaid = planCounts.growth + planCounts.enterprise;
    const totalCount = workspaces.length || 1;
    const paidConversionRate = Number(((totalPaid / totalCount) * 100).toFixed(2));

    const estimatedMrrInr = planCounts.growth * 3999 + planCounts.enterprise * 14999;
    const estimatedMrrUsd = planCounts.growth * 49 + planCounts.enterprise * 199;
    const arrUsd = (estimatedMrrUsd + estimatedMrrInr / 85) * 12;

    const arpuUsd = totalPaid > 0 ? Math.round((estimatedMrrUsd + estimatedMrrInr / 85) / totalPaid) : 0;

    return {
      overview: {
        totalWorkspaces: totalCount,
        paidWorkspaces: totalPaid,
        paidConversionRate,
        arpuUsd,
        arrUsd: Math.round(arrUsd),
      },
      mrrBreakdown: {
        inr: estimatedMrrInr,
        usd: estimatedMrrUsd,
      },
      planDistribution: planCounts,
      currencyDistribution: currencyCounts,
    };
  }

  async createCoupon(dto: CreateCouponDto) {
    const existing = await this.couponModel.findOne({ code: dto.code.toUpperCase() });
    if (existing) {
      throw new ConflictException(`Coupon code '${dto.code}' already exists.`);
    }

    const coupon = await this.couponModel.create({
      code: dto.code.toUpperCase(),
      discountType: dto.discountType,
      discountAmount: dto.discountAmount,
      currency: dto.currency || 'INR',
      maxRedemptions: dto.maxRedemptions || 100,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      isActive: true,
    });

    return coupon;
  }

  async listCoupons() {
    return this.couponModel.find().sort({ createdAt: -1 }).exec();
  }

  async toggleCoupon(id: string) {
    const coupon = await this.couponModel.findById(id);
    if (!coupon) {
      throw new NotFoundException(`Coupon ${id} not found`);
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();
    return coupon;
  }
}
