import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';

jest.mock('@notifyiq/config', () => ({
  env: {
    ENCRYPTION_KEY: '12345678901234567890123456789012',
    META_APP_ID: 'mock_app_id',
    META_APP_SECRET: 'mock_app_secret',
  },
}));

import { MetaService } from './meta.service.js';
import { Workspace } from '../database/schemas/workspace.schema.js';
import { AuditLog } from '../database/schemas/audit-log.schema.js';
import { MetaApiLog } from '../database/schemas/meta-api-log.schema.js';
import { encrypt } from '../lib/utils/encryption.js';
import { BadRequestException } from '@nestjs/common';

describe('MetaService', () => {
  let service: MetaService;

  const mockWorkspace = {
    _id: 'ws_123',
    waba: {
      wabaId: 'waba_123',
      businessAccountId: 'waba_123',
      phoneNumberId: 'phone_123',
      accessToken: encrypt('EAABmocktoken'),
    },
    save: jest.fn().mockResolvedValue(true),
  };

  const mockWorkspaceModel = {
    findById: jest.fn().mockResolvedValue(mockWorkspace),
  };

  const mockAuditLogModel = {
    create: jest.fn().mockResolvedValue({}),
  };

  const mockMetaApiLogModel = {
    create: jest.fn().mockResolvedValue({}),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      }),
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.MOCK_SERVICES = 'true';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetaService,
        { provide: getModelToken(Workspace.name), useValue: mockWorkspaceModel },
        { provide: getModelToken(AuditLog.name), useValue: mockAuditLogModel },
        { provide: getModelToken(MetaApiLog.name), useValue: mockMetaApiLogModel },
      ],
    }).compile();

    service = module.get<MetaService>(MetaService);
  });

  describe('createTemplate', () => {
    it('should create template with CTA buttons and media header in mock mode', async () => {
      const templateDto = {
        name: 'promo_discount',
        category: 'MARKETING' as const,
        language: 'en_US',
        headerType: 'IMAGE' as const,
        bodyText: 'Hello {{1}}, enjoy 20% off!',
        buttons: [
          { type: 'URL' as const, text: 'Claim Offer', value: 'https://bizeazer.in/offer' },
          { type: 'QUICK_REPLY' as const, text: 'Unsubscribe' },
        ],
      };

      const result = await service.createTemplate('ws_123', templateDto);

      expect(result).toHaveProperty('id');
      expect(result.status).toBe('APPROVED'); // Mock returns approved status
      expect(mockAuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'ws_123',
          action: 'meta.template_created',
        }),
      );
    });

    it('should throw BadRequestException if WABA is not connected to workspace', async () => {
      mockWorkspaceModel.findById.mockResolvedValueOnce({ _id: 'ws_unconnected', waba: null });

      await expect(
        service.createTemplate('ws_unconnected', {
          name: 'test',
          category: 'UTILITY',
          language: 'en',
          bodyText: 'Hi',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTemplates', () => {
    it('should retrieve message templates for workspace', async () => {
      const result = await service.getTemplates('ws_123');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete message template by name', async () => {
      const result = await service.deleteTemplate('ws_123', 'promo_discount');
      expect(result.success).toBe(true);
    });
  });

  describe('getWabaStatus', () => {
    it('should return connection status and default phone ID for workspace', async () => {
      const status = await service.getWabaStatus('ws_123');
      expect(status.isWabaConnected).toBe(true);
      expect(status.phoneNumberId).toBe('phone_123');
    });
  });

  describe('selectPhoneNumber', () => {
    it('should update workspace active phone number ID', async () => {
      const result = await service.selectPhoneNumber('ws_123', 'phone_999');
      expect(mockWorkspace.save).toHaveBeenCalled();
      expect(result.phoneNumberId).toBe('phone_999');
    });
  });

  describe('registerPhoneNumber', () => {
    it('should register new phone number and record audit log', async () => {
      const dto = { phoneNumber: '+919999988888', displayName: 'Support Desk' };
      const result = await service.registerPhoneNumber('ws_123', dto);
      expect(result).toHaveProperty('phoneNumberId');
      expect(mockAuditLogModel.create).toHaveBeenCalled();
    });
  });
});
