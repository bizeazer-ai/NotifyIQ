import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import crypto from 'crypto';
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
        const rawRazorpayAmount = subscription?.charge_amount || payload.payment?.entity?.amount;
        const razorpayAmount = rawRazorpayAmount ? rawRazorpayAmount / 100 : 4719;
        const rzpBase = Math.round(razorpayAmount / 1.18);
        const rzpGst = razorpayAmount - rzpBase;

        workspace.plan = notes.plan || 'growth';
        workspace.currency = 'INR';
        workspace.active = true;
        workspace.subscriptionStatus = 'active';
        workspace.currentPeriodStart = new Date();
        workspace.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await workspace.save();

        await this.auditLogModel.create({
          workspaceId: workspace._id.toString(),
          action: 'billing.payment_succeeded',
          resource: 'Workspace',
          resourceId: workspace._id.toString(),
          details: {
            eventId,
            transactionId: payload.payment?.entity?.id || eventId,
            invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
            paymentGateway: 'Razorpay',
            event,
            plan: workspace.plan,
            baseAmount: rzpBase,
            gstAmount: rzpGst,
            amount: razorpayAmount,
            totalAmount: razorpayAmount,
            currency: 'INR',
            gstApplied: '18% GST HSN 998314',
            status: 'PAID',
            paidAt: new Date(),
            notes: 'Invoice generated via Razorpay Webhook',
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
        const rawStripeAmount = dataObject.amount_paid || dataObject.amount_total;
        const stripeAmount = rawStripeAmount ? rawStripeAmount / 100 : 49;

        workspace.plan = metadata.plan || 'growth';
        workspace.currency = dataObject.currency?.toUpperCase() || 'USD';
        workspace.active = true;
        workspace.subscriptionStatus = 'active';
        workspace.currentPeriodStart = new Date();
        workspace.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        if (dataObject.customer) workspace.stripeCustomerId = typeof dataObject.customer === 'string' ? dataObject.customer : dataObject.customer.id;
        if (dataObject.subscription) workspace.stripeSubscriptionId = typeof dataObject.subscription === 'string' ? dataObject.subscription : dataObject.subscription.id;
        await workspace.save();

        await this.auditLogModel.create({
          workspaceId: workspace._id.toString(),
          action: 'billing.payment_succeeded',
          resource: 'Workspace',
          resourceId: workspace._id.toString(),
          details: {
            eventId,
            transactionId: dataObject.id || eventId,
            invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
            paymentGateway: 'Stripe',
            event,
            plan: workspace.plan,
            currency: workspace.currency,
            baseAmount: stripeAmount,
            gstAmount: 0,
            amount: stripeAmount,
            totalAmount: stripeAmount,
            status: 'PAID',
            paidAt: new Date(),
            notes: 'Invoice generated via Stripe Webhook',
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

  /**
   * Retrieve workspace currency, billing details, and payment methods
   */
  async getBillingSettings(workspaceId: string): Promise<{
    currency: string;
    plan: string;
    subscriptionStatus: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: Date | null;
    billingDetails: any;
    paymentMethods: any[];
  }> {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) throw new NotFoundException('Workspace not found');

    return {
      currency: workspace.currency || 'INR',
      plan: workspace.plan || 'free',
      subscriptionStatus: workspace.subscriptionStatus || 'active',
      cancelAtPeriodEnd: workspace.cancelAtPeriodEnd || false,
      currentPeriodEnd: workspace.currentPeriodEnd || null,
      billingDetails: workspace.billingDetails || {
        companyName: '',
        taxId: '',
        billingEmail: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
      },
      paymentMethods: workspace.paymentMethods || [],
    };
  }

  /**
   * Update currency & billing details / address
   */
  async updateBillingSettings(
    workspaceId: string,
    dto: { currency?: string; billingDetails?: any },
  ): Promise<{
    currency: string;
    billingDetails: any;
    paymentMethods: any[];
  }> {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) throw new NotFoundException('Workspace not found');

    if (dto.currency && ['INR', 'USD', 'EUR', 'GBP'].includes(dto.currency)) {
      workspace.currency = dto.currency;
    }

    if (dto.billingDetails) {
      workspace.billingDetails = {
        ...(workspace.billingDetails || {}),
        ...dto.billingDetails,
      };
    }

    await workspace.save();

    return {
      currency: workspace.currency,
      billingDetails: workspace.billingDetails,
      paymentMethods: workspace.paymentMethods || [],
    };
  }

  /**
   * Add a payment method (Card or UPI)
   */
  async addPaymentMethod(
    workspaceId: string,
    methodDto: {
      type: 'card' | 'upi' | 'bank_transfer';
      brand?: string;
      last4?: string;
      expiryMonth?: string;
      expiryYear?: string;
      upiId?: string;
      holderName?: string;
      isDefault?: boolean;
    },
  ): Promise<any[]> {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) throw new NotFoundException('Workspace not found');

    const paymentMethods = workspace.paymentMethods || [];
    const isFirstMethod = paymentMethods.length === 0;
    const isDefault = methodDto.isDefault || isFirstMethod;

    if (isDefault) {
      paymentMethods.forEach((m) => {
        m.isDefault = false;
      });
    }

    const newMethod = {
      id: `pm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: methodDto.type || 'card',
      brand: methodDto.brand || 'Visa',
      last4: methodDto.last4 || '4242',
      expiryMonth: methodDto.expiryMonth || '12',
      expiryYear: methodDto.expiryYear || '28',
      upiId: methodDto.upiId || '',
      holderName: methodDto.holderName || '',
      isDefault,
      createdAt: new Date(),
    };

    paymentMethods.push(newMethod);
    workspace.paymentMethods = paymentMethods;
    workspace.markModified('paymentMethods');
    await workspace.save();

    return workspace.paymentMethods;
  }

  /**
   * Delete a saved payment method
   */
  async deletePaymentMethod(workspaceId: string, methodId: string): Promise<any[]> {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) throw new NotFoundException('Workspace not found');

    let methods = (workspace.paymentMethods || []).filter((m) => m.id !== methodId);
    if (methods.length > 0 && !methods.some((m) => m.isDefault)) {
      methods[0].isDefault = true;
    }
    workspace.paymentMethods = methods;
    workspace.markModified('paymentMethods');
    await workspace.save();

    return workspace.paymentMethods;
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(workspaceId: string, methodId: string): Promise<any[]> {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) throw new NotFoundException('Workspace not found');

    const methods = workspace.paymentMethods || [];
    methods.forEach((m) => {
      m.isDefault = m.id === methodId;
    });
    workspace.paymentMethods = methods;
    workspace.markModified('paymentMethods');
    await workspace.save();

    return workspace.paymentMethods;
  }

  /**
   * Complete payment using an existing saved payment method or a new one
   * Supports both Razorpay (INR + GST) and Stripe (USD)
   */
  async payWithMethod(
    workspaceId: string,
    dto: {
      gateway: 'razorpay' | 'stripe';
      plan?: string;
      paymentMethodId?: string;
      newMethod?: any;
    },
  ): Promise<{
    success: boolean;
    requiresAction?: boolean;
    gateway?: 'razorpay' | 'stripe';
    checkoutUrl?: string;
    sessionId?: string;
    orderId?: string;
    keyId?: string;
    gstAmount?: number;
    transactionId?: string;
    invoiceNumber?: string;
    plan?: string;
    amount?: number;
    currency?: string;
    paymentMethod?: any;
    prefill?: any;
    message: string;
  }> {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) throw new NotFoundException('Workspace not found');

    const gateway = dto.gateway || 'razorpay';
    const plan = dto.plan || 'growth';
    const paymentMethods = workspace.paymentMethods || [];

    let selectedMethod: any = null;

    if (dto.paymentMethodId) {
      selectedMethod = paymentMethods.find((m) => m.id === dto.paymentMethodId);
      if (!selectedMethod) {
        throw new BadRequestException('Selected payment method not found in workspace.');
      }
    } else if (dto.newMethod) {
      if (dto.newMethod.saveForFuture) {
        const updatedMethods = await this.addPaymentMethod(workspaceId, dto.newMethod);
        selectedMethod = updatedMethods[updatedMethods.length - 1];
      } else {
        selectedMethod = {
          id: `pm_temp_${Date.now()}`,
          type: dto.newMethod.type || 'card',
          brand: dto.newMethod.brand || 'Visa',
          last4: dto.newMethod.last4 || '4242',
          upiId: dto.newMethod.upiId || '',
          holderName: dto.newMethod.holderName || '',
        };
      }
    } else if (paymentMethods.length > 0) {
      selectedMethod = paymentMethods.find((m) => m.isDefault) || paymentMethods[0];
    }

    // Determine pricing and currency
    let baseAmount = 0;
    let gstAmount = 0;
    let totalAmount = 0;
    let currency = 'USD';

    if (gateway === 'razorpay') {
      currency = 'INR';
      baseAmount = plan === 'enterprise' ? 14999 : 3999;
      gstAmount = Math.round(baseAmount * 0.18);
      totalAmount = baseAmount + gstAmount;
    } else {
      currency = 'USD';
      totalAmount = plan === 'enterprise' ? 199 : 49;
    }

    const isMock = process.env.MOCK_SERVICES === 'true';

    // 1. RAZORPAY PRODUCTION FLOW:
    if (gateway === 'razorpay') {
      if (!isMock) {
        const order = await this.createRazorpayOrder(workspaceId, baseAmount);

        return {
          success: true,
          requiresAction: true,
          gateway: 'razorpay',
          orderId: order.orderId,
          amount: order.amount,
          currency: 'INR',
          keyId: order.keyId,
          gstAmount: order.gstAmount,
          plan,
          paymentMethod: selectedMethod,
          prefill: {
            name: selectedMethod?.holderName || workspace.billingDetails?.companyName || workspace.name,
            email: workspace.billingDetails?.billingEmail || undefined,
            contact: workspace.billingDetails?.phone || undefined,
            method: selectedMethod?.type === 'upi' ? 'upi' : selectedMethod?.type === 'card' ? 'card' : undefined,
            vpa: selectedMethod?.upiId || undefined,
          },
          message: 'Razorpay bank order generated. Please complete 2FA payment authorization in the popup.',
        };
      }
    }

    // 2. STRIPE PRODUCTION FLOW:
    if (gateway === 'stripe') {
      const apiKey = env.STRIPE_API_KEY;
      if (!isMock && apiKey) {
        // Attempt off-session charge if workspace has Stripe Customer and tokenized payment method
        if (workspace.stripeCustomerId && selectedMethod?.stripePaymentMethodId) {
          try {
            const stripe = new Stripe(apiKey, { apiVersion: '2025-01-27.acacia' as any });
            const paymentIntent = await stripe.paymentIntents.create({
              amount: Math.round(totalAmount * 100),
              currency: 'usd',
              customer: workspace.stripeCustomerId,
              payment_method: selectedMethod.stripePaymentMethodId,
              confirm: true,
              off_session: true,
              metadata: { workspaceId, plan },
            });

            if (paymentIntent.status === 'succeeded') {
              const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
              const periodStart = new Date();
              const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

              workspace.plan = plan;
              workspace.currency = 'USD';
              workspace.active = true;
              workspace.subscriptionStatus = 'active';
              workspace.currentPeriodStart = periodStart;
              workspace.currentPeriodEnd = periodEnd;
              workspace.cancelAtPeriodEnd = false;
              await workspace.save();

              await this.auditLogModel.create({
                workspaceId: workspace._id.toString(),
                action: 'billing.payment_succeeded',
                resource: 'Workspace',
                resourceId: workspace._id.toString(),
                details: {
                  transactionId: paymentIntent.id,
                  invoiceNumber,
                  paymentGateway: 'Stripe',
                  paymentMethodUsed: `${selectedMethod.brand || 'Card'} •••• ${selectedMethod.last4 || '4242'}`,
                  plan,
                  baseAmount: totalAmount,
                  gstAmount: 0,
                  totalAmount,
                  currency: 'USD',
                  gstApplied: '0% (Export of Services)',
                  status: 'PAID',
                  paidAt: periodStart,
                  notes: `Charged via Stripe with tokenized card ${selectedMethod.last4}`,
                },
              });

              return {
                success: true,
                requiresAction: false,
                gateway: 'stripe',
                transactionId: paymentIntent.id,
                invoiceNumber,
                plan,
                amount: totalAmount,
                currency: 'USD',
                paymentMethod: selectedMethod,
                message: `Payment of $${totalAmount} successfully charged to ${selectedMethod.brand} •••• ${selectedMethod.last4} via Stripe.`,
              };
            }
          } catch (stripeErr: any) {
            this.logger.warn(`[BillingService] Stripe off-session direct charge failed: ${stripeErr.message}. Creating checkout session.`);
          }
        }

        // Create Stripe checkout session
        const session = await this.createStripeCheckoutSession(workspaceId, plan);
        return {
          success: true,
          requiresAction: true,
          gateway: 'stripe',
          checkoutUrl: session.checkoutUrl,
          sessionId: session.sessionId,
          plan,
          amount: totalAmount,
          currency: 'USD',
          message: 'Redirecting to secure Stripe checkout...',
        };
      }
    }

    // 3. Fallback for Mock Testing
    const transactionId = `${gateway === 'razorpay' ? 'pay_rzp_' : 'ch_str_'}${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    workspace.plan = plan;
    workspace.currency = currency;
    workspace.active = true;
    workspace.subscriptionStatus = 'active';
    await workspace.save();

    const paymentMethodLabel = selectedMethod?.type === 'upi'
      ? `UPI (${selectedMethod.upiId})`
      : `${selectedMethod?.brand || 'Card'} •••• ${selectedMethod?.last4 || '4242'}`;

    await this.auditLogModel.create({
      workspaceId: workspace._id.toString(),
      action: 'billing.payment_succeeded',
      resource: 'Workspace',
      resourceId: workspace._id.toString(),
      details: {
        transactionId,
        invoiceNumber,
        paymentGateway: gateway === 'razorpay' ? 'Razorpay' : 'Stripe',
        paymentMethodUsed: paymentMethodLabel,
        plan,
        baseAmount,
        gstAmount,
        totalAmount,
        currency,
        gstApplied: gateway === 'razorpay' ? '18% GST (HSN 998314)' : '0% (Export of Services)',
        status: 'PAID',
        paidAt: new Date(),
        notes: `Subscription charged via ${gateway.toUpperCase()} (Mock)`,
      },
    });

    return {
      success: true,
      requiresAction: false,
      transactionId,
      invoiceNumber,
      plan,
      amount: totalAmount,
      currency,
      paymentMethod: selectedMethod,
      message: `Payment of ${currency === 'INR' ? '₹' : '$'}${totalAmount.toLocaleString()} completed successfully (Mock Mode).`,
    };
  }

  /**
   * Cryptographically verify Razorpay client-side signature and activate subscription
   */
  async verifyRazorpayPayment(
    workspaceId: string,
    dto: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; plan?: string },
  ): Promise<{
    success: boolean;
    transactionId: string;
    invoiceNumber: string;
    plan: string;
    amount: number;
    currency: string;
    message: string;
  }> {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) throw new NotFoundException('Workspace not found');

    const keySecret = env.RAZORPAY_KEY_SECRET;
    const keyId = env.RAZORPAY_KEY_ID;
    const isMock = process.env.MOCK_SERVICES === 'true' || !keySecret || !keyId;

    let paymentDetails: any = null;

    if (!isMock) {
      if (!dto.razorpay_order_id || !dto.razorpay_payment_id || !dto.razorpay_signature) {
        throw new BadRequestException('Missing Razorpay verification parameters');
      }

      // 1. Verify HMAC-SHA256 signature
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${dto.razorpay_order_id}|${dto.razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== dto.razorpay_signature) {
        this.logger.error(`[BillingService] Signature mismatch for order ${dto.razorpay_order_id}`);
        throw new BadRequestException('Cryptographic payment verification failed. Invalid Razorpay signature.');
      }

      // 2. Fetch and capture payment from Razorpay API
      try {
        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const payment = await razorpay.payments.fetch(dto.razorpay_payment_id);

        if (payment.status !== 'captured' && payment.status !== 'authorized') {
          throw new BadRequestException(`Payment ${dto.razorpay_payment_id} is in status '${payment.status}' on Razorpay and has not been completed.`);
        }

        if (payment.status === 'authorized') {
          await razorpay.payments.capture(dto.razorpay_payment_id, payment.amount, 'INR');
        }

        paymentDetails = payment;
      } catch (err: any) {
        this.logger.error(`[BillingService] Razorpay API verification failed: ${err.message}`);
        throw new BadRequestException(`Razorpay payment verification failed: ${err.message}`);
      }
    }

    const plan = dto.plan || 'growth';
    const baseAmount = plan === 'enterprise' ? 14999 : 3999;
    const gstAmount = Math.round(baseAmount * 0.18);
    const totalAmount = baseAmount + gstAmount;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const periodStart = new Date();
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Extract and register real verified payment method from Razorpay
    let paymentMethodLabel = 'Razorpay Verified Payment';
    if (paymentDetails) {
      const pmType = paymentDetails.method === 'upi' ? 'upi' : paymentDetails.method === 'card' ? 'card' : 'bank_transfer';
      const realMethod: any = {
        id: `pm_rzp_${paymentDetails.id}`,
        type: pmType,
        brand: paymentDetails.card?.network || paymentDetails.bank || 'Razorpay',
        last4: paymentDetails.card?.last4 || '',
        expiryMonth: paymentDetails.card?.expiry_month ? String(paymentDetails.card.expiry_month) : '',
        expiryYear: paymentDetails.card?.expiry_year ? String(paymentDetails.card.expiry_year) : '',
        upiId: paymentDetails.vpa || '',
        holderName: paymentDetails.card?.name || workspace.name,
        isDefault: (workspace.paymentMethods || []).length === 0,
        createdAt: new Date(),
      };

      paymentMethodLabel = pmType === 'upi'
        ? `UPI (${paymentDetails.vpa})`
        : pmType === 'card'
        ? `${realMethod.brand} •••• ${realMethod.last4}`
        : `Bank Transfer (${realMethod.brand})`;

      const existingMethods = workspace.paymentMethods || [];
      const alreadySaved = existingMethods.some(
        (m) => (realMethod.upiId && m.upiId === realMethod.upiId) || (realMethod.last4 && m.last4 === realMethod.last4 && m.brand === realMethod.brand)
      );
      if (!alreadySaved) {
        existingMethods.push(realMethod);
        workspace.paymentMethods = existingMethods;
        workspace.markModified('paymentMethods');
      }
    }

    workspace.plan = plan;
    workspace.currency = 'INR';
    workspace.active = true;
    workspace.subscriptionStatus = 'active';
    workspace.currentPeriodStart = periodStart;
    workspace.currentPeriodEnd = periodEnd;
    workspace.cancelAtPeriodEnd = false;
    await workspace.save();

    await this.auditLogModel.create({
      workspaceId: workspace._id.toString(),
      action: 'billing.payment_succeeded',
      resource: 'Workspace',
      resourceId: workspace._id.toString(),
      details: {
        transactionId: dto.razorpay_payment_id,
        orderId: dto.razorpay_order_id,
        invoiceNumber,
        paymentGateway: 'Razorpay',
        paymentMethodUsed: paymentMethodLabel,
        plan,
        baseAmount,
        gstAmount,
        totalAmount,
        currency: 'INR',
        gstApplied: '18% GST (HSN 998314)',
        status: 'PAID',
        paidAt: periodStart,
        notes: `Razorpay verified payment captured for ${plan.toUpperCase()} plan`,
      },
    });

    return {
      success: true,
      transactionId: dto.razorpay_payment_id,
      invoiceNumber,
      plan,
      amount: totalAmount,
      currency: 'INR',
      message: `Razorpay payment verified & captured successfully. Workspace upgraded to ${plan.toUpperCase()} plan.`,
    };
  }

  /**
   * Verify Stripe Checkout Session and activate subscription
   */
  async verifyStripeSession(
    workspaceId: string,
    sessionId: string,
  ): Promise<{
    success: boolean;
    sessionId: string;
    invoiceNumber: string;
    plan: string;
    amount: number;
    currency: string;
    message: string;
  }> {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) throw new NotFoundException('Workspace not found');

    const apiKey = env.STRIPE_API_KEY;
    const isMock = process.env.MOCK_SERVICES === 'true' || !apiKey || sessionId.startsWith('cs_mock_');

    let plan = 'growth';
    let amount = 49;
    let currency = 'USD';
    let customerId = '';
    let subscriptionId = '';
    let stripePaymentMethodLabel = 'Stripe Checkout';

    if (!isMock) {
      try {
        const stripe = new Stripe(apiKey, { apiVersion: '2025-01-27.acacia' as any });
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['payment_intent.payment_method'],
        });

        if (session.payment_status !== 'paid' && session.status !== 'complete') {
          throw new BadRequestException('Stripe checkout session has not been completed or paid');
        }

        plan = session.metadata?.plan || 'growth';
        currency = session.currency?.toUpperCase() || 'USD';
        amount = session.amount_total ? session.amount_total / 100 : (plan === 'enterprise' ? 199 : 49);
        customerId = typeof session.customer === 'string' ? session.customer : (session.customer as any)?.id || '';
        subscriptionId = typeof session.subscription === 'string' ? session.subscription : (session.subscription as any)?.id || '';

        // Extract real tokenized card from Stripe payment intent
        const pi = session.payment_intent as any;
        if (pi?.payment_method?.card) {
          const card = pi.payment_method.card;
          const realMethod = {
            id: pi.payment_method.id,
            type: 'card' as const,
            brand: card.brand ? card.brand.charAt(0).toUpperCase() + card.brand.slice(1) : 'Visa',
            last4: card.last4 || '4242',
            expiryMonth: String(card.exp_month || '12'),
            expiryYear: String(card.exp_year || '28'),
            holderName: pi.payment_method.billing_details?.name || workspace.name,
            stripePaymentMethodId: pi.payment_method.id,
            isDefault: (workspace.paymentMethods || []).length === 0,
            createdAt: new Date(),
          };

          stripePaymentMethodLabel = `${realMethod.brand} •••• ${realMethod.last4}`;

          const existingMethods = workspace.paymentMethods || [];
          if (!existingMethods.some((m) => m.last4 === realMethod.last4 && m.brand === realMethod.brand)) {
            existingMethods.push(realMethod);
            workspace.paymentMethods = existingMethods;
            workspace.markModified('paymentMethods');
          }
        }
      } catch (err: any) {
        this.logger.error(`[BillingService] Stripe session verification error: ${err.message}`);
        throw new BadRequestException(`Stripe verification failed: ${err.message}`);
      }
    } else {
      plan = 'growth';
      amount = 49;
    }

    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const periodStart = new Date();
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    workspace.plan = plan;
    workspace.currency = currency;
    workspace.active = true;
    workspace.subscriptionStatus = 'active';
    workspace.currentPeriodStart = periodStart;
    workspace.currentPeriodEnd = periodEnd;
    workspace.cancelAtPeriodEnd = false;
    if (customerId) workspace.stripeCustomerId = customerId;
    if (subscriptionId) workspace.stripeSubscriptionId = subscriptionId;
    await workspace.save();

    await this.auditLogModel.create({
      workspaceId: workspace._id.toString(),
      action: 'billing.payment_succeeded',
      resource: 'Workspace',
      resourceId: workspace._id.toString(),
      details: {
        transactionId: sessionId,
        invoiceNumber,
        paymentGateway: 'Stripe',
        paymentMethodUsed: stripePaymentMethodLabel,
        plan,
        baseAmount: amount,
        gstAmount: 0,
        totalAmount: amount,
        currency,
        gstApplied: '0% (Export of Services)',
        status: 'PAID',
        paidAt: periodStart,
        notes: `Stripe verified checkout session for ${plan.toUpperCase()} plan`,
      },
    });

    return {
      success: true,
      sessionId,
      invoiceNumber,
      plan,
      amount,
      currency,
      message: `Stripe subscription verified. Workspace upgraded to ${plan.toUpperCase()} plan.`,
    };
  }

  /**
   * Cancel subscription (at period end)
   */
  async cancelSubscription(
    workspaceId: string,
    reason?: string,
  ): Promise<{
    success: boolean;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: Date | null;
    message: string;
  }> {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) throw new NotFoundException('Workspace not found');

    const apiKey = env.STRIPE_API_KEY;
    const isMock = process.env.MOCK_SERVICES === 'true' || !apiKey;

    if (!isMock && workspace.stripeSubscriptionId) {
      try {
        const stripe = new Stripe(apiKey, { apiVersion: '2025-01-27.acacia' as any });
        await stripe.subscriptions.update(workspace.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      } catch (err: any) {
        this.logger.warn(`[BillingService] Stripe subscription cancel error: ${err.message}`);
      }
    }

    workspace.cancelAtPeriodEnd = true;
    workspace.subscriptionStatus = 'canceling';
    await workspace.save();

    await this.auditLogModel.create({
      workspaceId: workspace._id.toString(),
      action: 'billing.subscription_canceled',
      resource: 'Workspace',
      resourceId: workspace._id.toString(),
      details: {
        plan: workspace.plan,
        reason: reason || 'User requested cancellation',
        canceledAt: new Date(),
        currentPeriodEnd: workspace.currentPeriodEnd,
      },
    });

    return {
      success: true,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: workspace.currentPeriodEnd || null,
      message: 'Subscription scheduled for cancellation at the end of the billing cycle.',
    };
  }

  /**
   * Retrieve itemized invoice details for printing/downloading
   */
  async getInvoiceById(workspaceId: string, invoiceId: string): Promise<any> {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) throw new NotFoundException('Workspace not found');

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(invoiceId);
    const query: any = { workspaceId };
    if (isObjectId) {
      query.$or = [{ _id: invoiceId }, { 'details.invoiceNumber': invoiceId }, { 'details.transactionId': invoiceId }];
    } else {
      query.$or = [{ 'details.invoiceNumber': invoiceId }, { 'details.transactionId': invoiceId }];
    }

    const log = await this.auditLogModel.findOne(query);
    if (!log) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }

    const details = log.details || {};
    const invoiceNumber = details.invoiceNumber || `INV-${new Date(log.createdAt).getFullYear()}-${log._id.toString().substring(0, 6).toUpperCase()}`;
    const currency = details.currency || workspace.currency || 'INR';
    const totalAmount = details.totalAmount || details.amount || (details.plan === 'enterprise' ? 17699 : 4719);
    const baseAmount = details.baseAmount || Math.round(totalAmount / 1.18);
    const gstAmount = details.gstAmount || (totalAmount - baseAmount);

    return {
      invoiceNumber,
      date: log.createdAt,
      paidAt: details.paidAt || log.createdAt,
      status: details.status || 'PAID',
      paymentGateway: details.paymentGateway || 'Razorpay',
      paymentMethodUsed: details.paymentMethodUsed || 'Direct Gateway',
      transactionId: details.transactionId || details.eventId || log._id.toString(),
      plan: details.plan || workspace.plan || 'growth',
      currency,
      baseAmount,
      gstAmount,
      totalAmount,
      gstRate: currency === 'INR' ? '18%' : '0%',
      hsnSacCode: '998314',
      seller: {
        legalName: 'Aadi IT Services LLP',
        brandName: 'NotifyIQ',
        website: 'https://www.aadiitservices.com',
        description: 'NotifyIQ is a product of Aadi IT Services LLP. Trademark Registration is under process.',
        gstin: '07AAAAA0000A1Z5',
        hsnCode: '998314',
        address: 'Tower B, Cyber City, Sector 24, Gurugram, Haryana 122002, India',
        supportEmail: 'billing@aadiitservices.com',
      },
      buyer: {
        workspaceName: workspace.name,
        companyName: workspace.billingDetails?.companyName || workspace.name,
        taxId: workspace.billingDetails?.taxId || 'URP (Unregistered Person)',
        billingEmail: workspace.billingDetails?.billingEmail || '',
        phone: workspace.billingDetails?.phone || '',
        address: `${workspace.billingDetails?.addressLine1 || ''} ${workspace.billingDetails?.addressLine2 || ''}`.trim() || 'Not Provided',
        city: workspace.billingDetails?.city || '',
        state: workspace.billingDetails?.state || '',
        postalCode: workspace.billingDetails?.postalCode || '',
        country: workspace.billingDetails?.country || 'India',
      },
      lineItems: [
        {
          description: `NotifyIQ ${(details.plan || workspace.plan || 'growth').toUpperCase()} Subscription Plan (Monthly)`,
          hsnSac: '998314',
          quantity: 1,
          unitPrice: baseAmount,
          taxAmount: gstAmount,
          total: totalAmount,
        },
      ],
    };
  }
}
