import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';

jest.mock('@notifyiq/config', () => ({
  env: {
    JWT_SECRET: 'test_secret',
    ENCRYPTION_KEY: '12345678901234567890123456789012',
  },
}));

jest.mock('bullmq', () => {
  return {
    Worker: jest.fn().mockImplementation((name, processor) => ({
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(true),
      processor,
    })),
  };
});

import { CampaignWorker } from './campaign.worker.js';
import { RedisService } from '../../common/services/redis.service.js';
import { SocketGateway } from '../../socket/socket.gateway.js';
import { Workspace } from '../../database/schemas/workspace.schema.js';
import { Contact } from '../../database/schemas/contact.schema.js';
import { Conversation } from '../../database/schemas/conversation.schema.js';
import { Message } from '../../database/schemas/message.schema.js';
import { encrypt } from '../../lib/utils/encryption.js';

describe('CampaignWorker', () => {
  let worker: CampaignWorker;
  let processor: Function;

  const mockRedisClient = {
    eval: jest.fn().mockResolvedValue(1),
  };

  const mockRedisService = {
    getClient: jest.fn().mockReturnValue(mockRedisClient),
  };

  const mockSocketGateway = {
    emitToWorkspace: jest.fn(),
  };

  const mockWorkspace = {
    _id: 'ws_123',
    waba: {
      phoneNumberId: 'phone_123',
      accessToken: encrypt('EAABmocktoken'),
    },
  };

  const mockContact = {
    _id: 'contact_1',
    phone: '+919876543210',
    optedOut: false,
    deletionRequestedAt: null,
  };

  const mockWorkspaceModel = {
    findById: jest.fn().mockResolvedValue(mockWorkspace),
  };

  const mockContactModel = {
    findById: jest.fn().mockResolvedValue(mockContact),
  };

  const mockConversationModel = {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ _id: 'conv_123' }),
  };

  const mockMessageModel = {
    create: jest.fn().mockResolvedValue({ _id: 'msg_123', status: 'sent' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.MOCK_SERVICES = 'true';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignWorker,
        { provide: RedisService, useValue: mockRedisService },
        { provide: SocketGateway, useValue: mockSocketGateway },
        { provide: getModelToken(Workspace.name), useValue: mockWorkspaceModel },
        { provide: getModelToken(Contact.name), useValue: mockContactModel },
        { provide: getModelToken(Conversation.name), useValue: mockConversationModel },
        { provide: getModelToken(Message.name), useValue: mockMessageModel },
      ],
    }).compile();

    worker = module.get<CampaignWorker>(CampaignWorker);
    worker.onModuleInit();
    processor = (worker as any).worker.processor;
  });

  describe('Campaign Job Execution', () => {
    it('should process campaign dispatches and enforce opt-out checks', async () => {
      const jobData = {
        data: {
          campaignId: 'camp_101',
          workspaceId: 'ws_123',
          templateName: 'summer_promo',
          contactIds: ['contact_1'],
          languageCode: 'en',
        },
      };

      const result = await processor(jobData);

      expect(mockWorkspaceModel.findById).toHaveBeenCalledWith('ws_123');
      expect(mockContactModel.findById).toHaveBeenCalledWith('contact_1');
      expect(mockMessageModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'ws_123',
          direction: 'outbound',
          type: 'template',
        }),
      );
      expect(mockSocketGateway.emitToWorkspace).toHaveBeenCalledWith('ws_123', 'message.sent', expect.any(Object));
      expect(result).toEqual({
        campaignId: 'camp_101',
        successCount: 1,
        skipCount: 0,
      });
    });

    it('should skip opted-out contacts for DPDP compliance', async () => {
      mockContactModel.findById.mockResolvedValueOnce({ ...mockContact, optedOut: true });

      const jobData = {
        data: {
          campaignId: 'camp_102',
          workspaceId: 'ws_123',
          templateName: 'summer_promo',
          contactIds: ['contact_opted_out'],
          languageCode: 'en',
        },
      };

      const result = await processor(jobData);

      expect(result.successCount).toBe(0);
      expect(result.skipCount).toBe(1);
    });
  });
});
