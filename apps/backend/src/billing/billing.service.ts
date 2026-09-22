import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import { env } from '@notifyiq/config';
import { Workspace, WorkspaceDocument } from '../database/schemas/workspace.schema.js';
import { AuditLog, AuditLogDocument } from '../database/schemas/audit-log.schema.js';
import { Conversation, ConversationDocument } from '../database/schemas/conversation.schema.js';
import { Message, MessageDocument } from '../database/schemas/message.schema.js';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
  ) { }

  /**
   * Create Stripe Checkout Session
   */
  async createStripeCheckoutSession(workspaceId: string, plan: string = 'growth'): Promise<{ checkoutUrl: string; sessionId: string }> {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) throw new NotFoundException('Workspace not found');

    const apiKey = env.STRIPE_API_KEY;
    const isMock = process.env.MOCK_SERVICES === 'true' || !apiKey;

    if (isMock) {
      this.logger.log(`[BillingService] Mock Stripe Checkout session generated for workspace ${workspaceId}`);
      return {
        checkoutUrl: `https://checkout.stripe.com/c/pay/mock_session_${Date.now()}`,
        sessionId: `cs_mock_${Date.now()}`,
      };
    }

    try {
      const stripe = new Stripe(apiKey, { apiVersion: '2025-01-27.acacia' as any });
      const priceAmount = plan === 'enterprise' ? 19900 : 4900; // $199 or $49 in cents

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `NotifyIQ ${plan.toUpperCase()} Plan Subscription`,
                description: 'WhatsApp API Reseller & AI Automation Suite',
              },
              unit_amount: priceAmount,
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/billing?canceled=true`,
        metadata: { workspaceId, plan },
      });

      return {
        checkoutUrl: session.url || '',
        sessionId: session.id,
      };
    } catch (err: any) {
      this.logger.error(`[BillingService] Stripe Checkout creation error: ${err.message}`);
      throw new BadRequestException(err.message);
    }
  }

  /**
   * Create Razorpay Order with 18% GST
   */
  async createRazorpayOrder(workspaceId: string, amountInr: number = 3999): Promise<{ orderId: string; amount: number; currency: string; keyId: string; gstAmount: number }> {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) throw new NotFoundException('Workspace not found');

    const keyId = env.RAZORPAY_KEY_ID;
    const keySecret = env.RAZORPAY_KEY_SECRET;
    const isMock = process.env.MOCK_SERVICES === 'true' || !keyId || !keySecret;

    // Calculate 18% GST (HSN 998314)
    const baseAmount = amountInr;
    const gstAmount = Math.round(baseAmount * 0.18);
    const totalAmountInr = baseAmount + gstAmount;
    const totalAmountPaise = totalAmountInr * 100; // Razorpay expects amount in paise

    if (isMock) {
      this.logger.log(`[BillingService] Mock Razorpay Order created for workspace ${workspaceId}`);
      return {
        orderId: `order_mock_${Date.now()}`,
        amount: totalAmountPaise,
        currency: 'INR',
        keyId: keyId || 'rzp_test_mockkey123',
        gstAmount,
      };
    }

    try {
      console.log("KEY ID, and Secretm and amounts", keyId, keySecret, totalAmountPaise);
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const order = await razorpay.orders.create({
        amount: totalAmountPaise,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
        notes: { workspaceId, hsn: '998314', gstRate: '18%' },
      });

      return {
        orderId: order.id,
        amount: totalAmountPaise,
        currency: 'INR',
        keyId,
        gstAmount,
      };
    } catch (err: any) {
      console.error(err);
      this.logger.error(`[BillingService] Razorpay Order creation error: ${err}`);
      throw new BadRequestException(err.message);
    }
  }

  async handleRazorpayWebhook(event: string, payload: any): Promise<void> {
    this.logger.log(`[BillingService] Processing Razorpay Webhook: ${event}`);

    const eventId = payload.event_id || payload.payload?.payment?.entity?.id || `rzp_${Date.now()}`;
    const subscription = payload.subscription?.entity;
    const notes = subscription?.notes || payload.payment?.entity?.notes || {};
    const workspaceId = notes.workspaceId;

    if (!workspaceId) {
      this.logger.warn('[BillingService] Razorpay payload missing workspaceId note');
      return;
    }

    // Idempotency check: prevent duplicate audit log & plan updates on webhook retries
    const existingLog = await this.auditLogModel.findOne({
      workspaceId,
      'details.eventId': eventId,
    });
    if (existingLog) {
      this.logger.log(`[BillingService] Razorpay event ${eventId} already processed. Skipping.`);
      return;
    }

    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) return;

    switch (event) {
      case 'subscription.activated':
      case 'subscription.charged':
      case 'payment.captured':
        workspace.plan = 'growth';
        workspace.currency = 'INR';
        workspace.active = true;
        await workspace.save();

        await this.auditLogModel.create({
          workspaceId: workspace._id.toString(),
          action: 'billing.payment_succeeded',
          resource: 'Workspace',
          resourceId: workspace._id.toString(),
          details: {
            eventId,
            paymentGateway: 'Razorpay',
            event,
            plan: 'growth',
            amount: subscription?.charge_amount || 3999,
            gstApplied: '18% GST HSN 998314',
            notes: 'Invoice generated successfully',
          },
        });
        break;

      case 'subscription.pending':
      case 'subscription.halted':
      case 'payment.failed':
        workspace.plan = 'free';
        await workspace.save();

        await this.auditLogModel.create({
          workspaceId: workspace._id.toString(),
          action: 'billing.payment_failed',
          resource: 'Workspace',
          resourceId: workspace._id.toString(),
          details: {
            eventId,
            paymentGateway: 'Razorpay',
            event,
            notes: 'Subscription payment failed or halted.',
          },
        });
        break;
    }
  }

  async handleStripeWebhook(event: string, payload: any): Promise<void> {
    this.logger.log(`[BillingService] Processing Stripe Webhook: ${event}`);

    const eventId = payload.id || `stripe_${Date.now()}`;
    const dataObject = payload.data?.object;
    const metadata = dataObject?.metadata || {};
    const workspaceId = metadata.workspaceId;

    if (!workspaceId) return;

    // Idempotency check: prevent duplicate audit log & plan updates on webhook retries
    const existingLog = await this.auditLogModel.findOne({
      workspaceId,
      'details.eventId': eventId,
    });
    if (existingLog) {
      this.logger.log(`[BillingService] Stripe event ${eventId} already processed. Skipping.`);
      return;
    }

    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) return;

    switch (event) {
      case 'checkout.session.completed':
      case 'customer.subscription.created':
      case 'invoice.payment_succeeded':
        workspace.plan = metadata.plan || 'growth';
        workspace.currency = dataObject.currency?.toUpperCase() || 'USD';
        workspace.active = true;
        await workspace.save();

        await this.auditLogModel.create({
          workspaceId: workspace._id.toString(),
          action: 'billing.payment_succeeded',
          resource: 'Workspace',
          resourceId: workspace._id.toString(),
          details: {
            eventId,
            paymentGateway: 'Stripe',
            event,
            plan: workspace.plan,
            currency: workspace.currency,
            amount: dataObject.amount_paid || 4900,
          },
        });
        break;

      case 'customer.subscription.deleted':
      case 'invoice.payment_failed':
        workspace.plan = 'free';
        await workspace.save();

        await this.auditLogModel.create({
          workspaceId: workspace._id.toString(),
          action: 'billing.payment_failed',
          resource: 'Workspace',
          resourceId: workspace._id.toString(),
          details: {
            paymentGateway: 'Stripe',
            event,
            notes: 'Stripe subscription canceled or payment failed.',
          },
        });
        break;
    }
  }

  async calculateWholesaleUsage(agencyWorkspaceId: string): Promise<any> {
    const agency = await this.workspaceModel.findById(agencyWorkspaceId);
    if (!agency) throw new NotFoundException('Agency workspace not found');

    const childWorkspaces = await this.workspaceModel.find({ 'whitelabel.parentAgencyId': agencyWorkspaceId });
    const childWorkspaceIds = childWorkspaces.map((ws) => ws._id.toString());

    const conversations = await this.conversationModel.find({ workspaceId: { $in: childWorkspaceIds } });
    const conversationIds = conversations.map((conv) => conv._id.toString());

    const messageCount = await this.messageModel.countDocuments({
      conversationId: { $in: conversationIds },
      direction: 'outbound',
    });

    const wholesaleRate = 0.002;
    const totalCost = messageCount * wholesaleRate;

    return {
      agencyWorkspaceId,
      agencyName: agency.name,
      subAccountsCount: childWorkspaces.length,
      subAccountsList: childWorkspaces.map((ws) => ({ id: ws._id, name: ws.name, slug: ws.slug })),
      billingPeriod: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
      usageStats: {
        totalOutboundMessages: messageCount,
        wholesaleRate,
        totalCost,
      },
    };
  }

  async getInvoices(workspaceId: string): Promise<AuditLog[]> {
    return this.auditLogModel
      .find({ workspaceId, action: { $regex: /^billing\./ } })
      .sort({ createdAt: -1 })
      .exec();
  }
}
