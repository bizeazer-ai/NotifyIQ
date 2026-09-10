import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@notifyiq/config', () => ({
  env: {
    STRIPE_API_KEY: 'sk_test_mock',
    STRIPE_WEBHOOK_SECRET: 'whsec_mock',
    RAZORPAY_KEY_ID: 'rzp_test_mock',
    RAZORPAY_KEY_SECRET: 'rzp_secret_mock',
  },
}));

import { BillingController } from './billing.controller.js';
import { BillingService } from './billing.service.js';
import { AuthGuard, WorkspaceGuard } from '../common/guards/index.js';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import crypto from 'crypto';

describe('BillingController', () => {
  let controller: BillingController;
  let service: jest.Mocked<BillingService>;

  const mockBillingService = {
    createStripeCheckoutSession: jest.fn(),
    createRazorpayOrder: jest.fn(),
    handleRazorpayWebhook: jest.fn(),
    handleStripeWebhook: jest.fn(),
    calculateWholesaleUsage: jest.fn(),
    getInvoices: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [{ provide: BillingService, useValue: mockBillingService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(WorkspaceGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BillingController>(BillingController);
    service = module.get(BillingService);
  });

  describe('createStripeCheckout', () => {
    it('should initialize stripe checkout session', async () => {
      const mockSession = { checkoutUrl: 'https://checkout.stripe.com/pay', sessionId: 'cs_123' };
      service.createStripeCheckoutSession.mockResolvedValue(mockSession);

      const req = { workspaceId: 'ws_123' } as any;
      const res = await controller.createStripeCheckout(req, { plan: 'growth' });

      expect(service.createStripeCheckoutSession).toHaveBeenCalledWith('ws_123', 'growth');
      expect(res.data).toEqual(mockSession);
    });
  });

  describe('createRazorpayOrder', () => {
    it('should initialize razorpay order with GST calculation', async () => {
      const mockOrder = { orderId: 'order_123', amount: 471900, currency: 'INR', keyId: 'key_123', gstAmount: 720 };
      service.createRazorpayOrder.mockResolvedValue(mockOrder);

      const req = { workspaceId: 'ws_123' } as any;
      const res = await controller.createRazorpayOrder(req, { amount: 3999 });

      expect(service.createRazorpayOrder).toHaveBeenCalledWith('ws_123', 3999);
      expect(res.data).toEqual(mockOrder);
    });
  });


  describe('razorpayWebhook', () => {
    it('should reject razorpay webhook if signature header is missing in non-mock mode', async () => {
      delete process.env.MOCK_SERVICES;
      const req = { rawBody: Buffer.from('{"event":"payment.captured"}'), body: {} } as any;
      await expect(controller.razorpayWebhook(req, '')).rejects.toThrow(UnauthorizedException);
    });

    it('should process razorpay webhook successfully when signature is valid', async () => {
      process.env.MOCK_SERVICES = 'true';
      const req = {
        body: { event: 'payment.captured', payload: { payment: { entity: { notes: { workspaceId: 'ws_123' } } } } },
      } as any;

      const res = await controller.razorpayWebhook(req, 'mock_sig');
      expect(res.success).toBe(true);
      expect(service.handleRazorpayWebhook).toHaveBeenCalledWith('payment.captured', expect.any(Object));
    });
  });

  describe('stripeWebhook', () => {
    it('should process stripe webhook successfully in mock mode', async () => {
      process.env.MOCK_SERVICES = 'true';
      const req = {
        body: { type: 'checkout.session.completed', data: { object: { metadata: { workspaceId: 'ws_123' } } } },
      } as any;

      const res = await controller.stripeWebhook(req, 't=123,v1=mock_sig');
      expect(res.success).toBe(true);
      expect(service.handleStripeWebhook).toHaveBeenCalledWith('checkout.session.completed', req.body);
    });
  });

  describe('getWholesaleUsage', () => {
    it('should return wholesale usage data for agency workspace', async () => {
      const mockUsage = { subAccountsCount: 2, usageStats: { totalCost: 10 } };
      service.calculateWholesaleUsage.mockResolvedValue(mockUsage as any);

      const req = { workspaceId: 'agency_1' } as any;
      const res = await controller.getWholesaleUsage(req);

      expect(service.calculateWholesaleUsage).toHaveBeenCalledWith('agency_1');
      expect(res.data).toEqual(mockUsage);
    });
  });

  describe('getInvoices', () => {
    it('should return invoices for given workspace', async () => {
      const mockInvoices = [{ _id: 'inv_1' }] as any;
      service.getInvoices.mockResolvedValue(mockInvoices);

      const req = { workspaceId: 'ws_123' } as any;
      const res = await controller.getInvoices(req);

      expect(service.getInvoices).toHaveBeenCalledWith('ws_123');
      expect(res.data).toEqual(mockInvoices);
    });
  });
});
