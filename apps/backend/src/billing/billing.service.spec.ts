import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';

jest.mock('@notifyiq/config', () => ({
  env: {
    STRIPE_API_KEY: 'sk_test_mock',
    STRIPE_WEBHOOK_SECRET: 'whsec_mock',
    RAZORPAY_KEY_ID: 'rzp_test_mock',
    RAZORPAY_KEY_SECRET: 'rzp_secret_mock',
  },
}));

import { BillingService } from './billing.service.js';
import { Workspace } from '../database/schemas/workspace.schema.js';
import { AuditLog } from '../database/schemas/audit-log.schema.js';
import { Conversation } from '../database/schemas/conversation.schema.js';
import { Message } from '../database/schemas/message.schema.js';
import { NotFoundException } from '@nestjs/common';

describe('BillingService', () => {
  let service: BillingService;

  const mockWorkspace = {
    _id: 'ws_123456789',
    name: 'Test Workspace',
    slug: 'test-workspace',
    plan: 'free',
    currency: 'USD',
    active: true,
    save: jest.fn().mockResolvedValue(true),
  };

  const mockWorkspaceModel = {
    findById: jest.fn(),
    find: jest.fn(),
  };

  const mockAuditLogModel = {
    create: jest.fn().mockResolvedValue({}),
    findOne: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          {
            _id: 'inv_1',
            action: 'billing.payment_succeeded',
            createdAt: new Date(),
            details: { paymentGateway: 'Stripe', amount: 49 },
          },
        ]),
      }),
    }),
  };

  const mockConversationModel = {
    find: jest.fn().mockResolvedValue([{ _id: 'conv_1' }]),
  };

  const mockMessageModel = {
    countDocuments: jest.fn().mockResolvedValue(150),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: getModelToken(Workspace.name), useValue: mockWorkspaceModel },
        { provide: getModelToken(AuditLog.name), useValue: mockAuditLogModel },
        { provide: getModelToken(Conversation.name), useValue: mockConversationModel },
        { provide: getModelToken(Message.name), useValue: mockMessageModel },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  describe('createStripeCheckoutSession', () => {
    it('should throw NotFoundException if workspace does not exist', async () => {
      mockWorkspaceModel.findById.mockResolvedValue(null);
      await expect(service.createStripeCheckoutSession('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should return mock checkout session when MOCK_SERVICES is enabled', async () => {
      process.env.MOCK_SERVICES = 'true';
      mockWorkspaceModel.findById.mockResolvedValue(mockWorkspace);

      const result = await service.createStripeCheckoutSession('ws_123456789', 'growth');
      expect(result).toHaveProperty('checkoutUrl');
      expect(result).toHaveProperty('sessionId');
      expect(result.checkoutUrl).toContain('checkout.stripe.com');
    });
  });

  describe('createRazorpayOrder', () => {
    it('should calculate 18% GST correctly', async () => {
      process.env.MOCK_SERVICES = 'true';
      mockWorkspaceModel.findById.mockResolvedValue(mockWorkspace);

      const result = await service.createRazorpayOrder('ws_123456789', 3999);
      expect(result.currency).toBe('INR');
      expect(result.gstAmount).toBe(720); // 18% of 3999 = 719.82 -> Math.round = 720
      expect(result.amount).toBe(471900); // (3999 + 720) * 100 paise
    });
  });

  describe('handleStripeWebhook', () => {
    it('should upgrade workspace plan and record audit log on checkout.session.completed', async () => {
      mockWorkspaceModel.findById.mockResolvedValue({ ...mockWorkspace, save: jest.fn().mockResolvedValue(true) });

      await service.handleStripeWebhook('checkout.session.completed', {
        data: {
          object: {
            currency: 'usd',
            amount_paid: 4900,
            metadata: { workspaceId: 'ws_123456789', plan: 'growth' },
          },
        },
      });

      expect(mockWorkspaceModel.findById).toHaveBeenCalledWith('ws_123456789');
      expect(mockAuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'ws_123456789',
          action: 'billing.payment_succeeded',
        }),
      );
    });

    it('should downgrade workspace plan to free on invoice.payment_failed', async () => {
      const workspaceToUpdate = { ...mockWorkspace, plan: 'growth', save: jest.fn().mockResolvedValue(true) };
      mockWorkspaceModel.findById.mockResolvedValue(workspaceToUpdate);

      await service.handleStripeWebhook('invoice.payment_failed', {
        data: {
          object: {
            metadata: { workspaceId: 'ws_123456789' },
          },
        },
      });

      expect(workspaceToUpdate.plan).toBe('free');
      expect(mockAuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'ws_123456789',
          action: 'billing.payment_failed',
        }),
      );
    });
  });

  describe('handleRazorpayWebhook', () => {
    it('should upgrade workspace plan on payment.captured', async () => {
      const workspaceToUpdate = { ...mockWorkspace, plan: 'free', save: jest.fn().mockResolvedValue(true) };
      mockWorkspaceModel.findById.mockResolvedValue(workspaceToUpdate);

      await service.handleRazorpayWebhook('payment.captured', {
        payment: {
          entity: {
            notes: { workspaceId: 'ws_123456789' },
          },
        },
      });

      expect(workspaceToUpdate.plan).toBe('growth');
      expect(workspaceToUpdate.currency).toBe('INR');
    });
  });

  describe('calculateWholesaleUsage', () => {
    it('should calculate wholesale cost for agency sub-workspaces', async () => {
      mockWorkspaceModel.findById.mockResolvedValue({ _id: 'agency_1', name: 'Parent Agency' });
      mockWorkspaceModel.find.mockResolvedValue([{ _id: 'sub_1', name: 'Child Ws', slug: 'child' }]);
      mockConversationModel.find.mockResolvedValue([{ _id: 'conv_1' }]);
      mockMessageModel.countDocuments.mockResolvedValue(1000);

      const usage = await service.calculateWholesaleUsage('agency_1');
      expect(usage.subAccountsCount).toBe(1);
      expect(usage.usageStats.totalOutboundMessages).toBe(1000);
      expect(usage.usageStats.totalCost).toBe(2.0); // 1000 * 0.002
    });
  });

  describe('getInvoices', () => {
    it('should query audit logs scoped by workspaceId', async () => {
      const invoices = await service.getInvoices('ws_123456789');
      expect(mockAuditLogModel.find).toHaveBeenCalledWith({
        workspaceId: 'ws_123456789',
        action: { $regex: /^billing\./ },
      });
      expect(invoices).toHaveLength(1);
    });
  });
});
