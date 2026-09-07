import { Controller, Get, Post, Body, Headers, Req, HttpCode, HttpStatus, UnauthorizedException, BadRequestException, UseGuards } from '@nestjs/common';
import crypto from 'crypto';
import { env } from '@notifyiq/config';
import { BillingService } from './billing.service.js';
import { AuthGuard, WorkspaceGuard } from '../common/guards/index.js';
import type { AuthenticatedRequest } from '../common/guards/index.js';

interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
  body: any;
}

@Controller('api/billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('stripe/checkout')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async createStripeCheckout(
    @Req() req: AuthenticatedRequest,
    @Body('plan') plan: string = 'growth',
  ) {
    const workspaceId = req.workspaceId as string;
    const session = await this.billingService.createStripeCheckoutSession(workspaceId, plan);
    return {
      message: 'Stripe Checkout Session initialized',
      data: session,
    };
  }

  @Post('razorpay/order')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async createRazorpayOrder(
    @Req() req: AuthenticatedRequest,
    @Body('amount') amount: number = 3999,
  ) {
    const workspaceId = req.workspaceId as string;
    const order = await this.billingService.createRazorpayOrder(workspaceId, amount);
    return {
      message: 'Razorpay Order created with 18% GST calculation',
      data: order,
    };
  }

  @Post('razorpay/webhook')
  @HttpCode(HttpStatus.OK)
  async razorpayWebhook(
    @Req() req: RequestWithRawBody,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const isMock = process.env.MOCK_SERVICES === 'true';
    if (!isMock) {
      const webhookSecret = env.RAZORPAY_KEY_SECRET;
      if (!webhookSecret) {
        throw new BadRequestException('Razorpay webhook secret is not configured');
      }

      if (!signature) {
        throw new UnauthorizedException('Missing signature header');
      }

      if (!req.rawBody) {
        throw new BadRequestException('Raw request body is required for verification');
      }

      const hmac = crypto.createHmac('sha256', webhookSecret);
      hmac.update(req.rawBody);
      const expectedSignature = hmac.digest('hex');

      if (expectedSignature !== signature) {
        throw new UnauthorizedException('Invalid signature');
      }
    }

    const { event, payload } = req.body;
    await this.billingService.handleRazorpayWebhook(event, payload);

    return { success: true };
  }

  @Post('stripe/webhook')
  @HttpCode(HttpStatus.OK)
  async stripeWebhook(
    @Req() req: RequestWithRawBody,
    @Headers('stripe-signature') signature: string,
  ) {
    const isMock = process.env.MOCK_SERVICES === 'true';
    if (!isMock) {
      const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new BadRequestException('Stripe webhook secret is not configured');
      }

      if (!signature) {
        throw new UnauthorizedException('Missing signature header');
      }

      if (!req.rawBody) {
        throw new BadRequestException('Raw request body is required for verification');
      }

      try {
        const parts = signature.split(',');
        const tPart = parts.find((p) => p.trim().startsWith('t='));
        const v1Part = parts.find((p) => p.trim().startsWith('v1='));

        if (!tPart || !v1Part) {
          throw new UnauthorizedException('Invalid signature format');
        }

        const timestamp = tPart.split('=')[1];
        const expectedSignature = v1Part.split('=')[1];

        const signedPayload = `${timestamp}.${req.rawBody.toString('utf8')}`;

        const hmac = crypto.createHmac('sha256', webhookSecret);
        hmac.update(signedPayload);
        const actualSignature = hmac.digest('hex');

        if (actualSignature !== expectedSignature) {
          throw new UnauthorizedException('Invalid signature');
        }
      } catch (err: any) {
        throw new UnauthorizedException('Invalid signature verification');
      }
    }

    const event = req.body?.type;
    await this.billingService.handleStripeWebhook(event, req.body);

    return { success: true };
  }

  @Get('wholesale-usage')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async getWholesaleUsage(@Req() req: AuthenticatedRequest) {
    const agencyWorkspaceId = req.workspaceId as string;
    const usage = await this.billingService.calculateWholesaleUsage(agencyWorkspaceId);
    return {
      message: 'Wholesale agency usage stats retrieved successfully',
      data: usage,
    };
  }

  @Get('invoices')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async getInvoices(@Req() req: AuthenticatedRequest) {
    const workspaceId = req.workspaceId as string;
    const invoices = await this.billingService.getInvoices(workspaceId);
    return {
      message: 'Invoices retrieved successfully',
      data: invoices,
    };
  }
}
