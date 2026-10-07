import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service.js';
import { Message } from '../database/schemas/message.schema.js';
import { Conversation } from '../database/schemas/conversation.schema.js';
import { Contact } from '../database/schemas/contact.schema.js';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const mockMessageModel = {
    countDocuments: jest.fn(),
    aggregate: jest.fn().mockResolvedValue([]),
  };

  const mockConversationModel = {
    countDocuments: jest.fn(),
  };

  const mockContactModel = {
    countDocuments: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getModelToken(Message.name), useValue: mockMessageModel },
        { provide: getModelToken(Conversation.name), useValue: mockConversationModel },
        { provide: getModelToken(Contact.name), useValue: mockContactModel },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  describe('getExecutiveOverview', () => {
    it('should calculate metrics scoped by workspaceId', async () => {
      mockMessageModel.countDocuments
        .mockResolvedValueOnce(500) // totalMessages
        .mockResolvedValueOnce(300) // outboundMessages
        .mockResolvedValueOnce(285); // deliveredMessages

      mockConversationModel.countDocuments
        .mockResolvedValueOnce(100) // totalConversations
        .mockResolvedValueOnce(5); // urgentConversations

      mockContactModel.countDocuments.mockResolvedValueOnce(250); // totalContacts

      const metrics = await service.getExecutiveOverview('ws_123');

      expect(metrics.workspaceId).toBe('ws_123');
      expect(metrics.totalMessages).toBe(500);
      expect(metrics.outboundMessages).toBe(300);
      expect(metrics.deliveredMessages).toBe(285);
      expect(metrics.deliveryRatePercent).toBe(95.0); // 285/300 * 100
      expect(metrics.botContainmentRatePercent).toBe(95.0); // 100 - (5/100 * 100)
      expect(metrics.totalContacts).toBe(250);
      expect(metrics.totalAccruedCost).toBe(0.6); // 300 * 0.002
    });

    it('should handle zero message workspaces cleanly without division by zero errors', async () => {
      mockMessageModel.countDocuments.mockResolvedValue(0);
      mockConversationModel.countDocuments.mockResolvedValue(0);
      mockContactModel.countDocuments.mockResolvedValue(0);

      const metrics = await service.getExecutiveOverview('ws_empty');

      expect(metrics.deliveryRatePercent).toBe(0);
      expect(metrics.botContainmentRatePercent).toBe(0);
      expect(metrics.totalAccruedCost).toBe(0);
    });
  });
});
