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

import { WebhookWorker } from './webhook.worker.js';
import { RedisService } from '../../common/services/redis.service.js';
import { QueueService } from '../queue.service.js';
import { SocketGateway } from '../../socket/socket.gateway.js';
import { RagService } from '../../ai/rag.service.js';
import { FlowExecutionEngine } from '../../flows/flow-execution.engine.js';
import { Workspace } from '../../database/schemas/workspace.schema.js';
import { Contact } from '../../database/schemas/contact.schema.js';
import { Conversation } from '../../database/schemas/conversation.schema.js';
import { Message } from '../../database/schemas/message.schema.js';

describe('WebhookWorker Auto-Reply Engine', () => {
  let worker: WebhookWorker;

  const mockRedisService = { getClient: jest.fn().mockReturnValue({}) };
  const mockQueueService = { addJob: jest.fn().mockResolvedValue({}) };
  const mockSocketGateway = { emitToWorkspace: jest.fn() };
  const mockRagService = { queryKnowledgeBase: jest.fn() };
  const mockFlowExecutionEngine = { executeFlowForInboundMessage: jest.fn().mockResolvedValue({ executed: false }) };

  const mockWorkspace = {
    _id: 'ws_123',
    waba: { phoneNumberId: 'phone_123' },
    autoReplySettings: {
      enabled: true,
      confidenceThreshold: 0.75,
      fallbackToHuman: true,
    },
  };

  const mockConversation = { _id: 'conv_123', save: jest.fn() };
  const mockContact = { _id: 'contact_123' };

  const mockWorkspaceModel = { findOne: jest.fn().mockResolvedValue(mockWorkspace) };
  const mockContactModel = { findOne: jest.fn().mockResolvedValue(mockContact) };
  const mockConversationModel = { findOne: jest.fn().mockResolvedValue(mockConversation) };
  const mockMessageModel = {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ _id: 'msg_123', body: 'AI answer' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookWorker,
        { provide: RedisService, useValue: mockRedisService },
        { provide: QueueService, useValue: mockQueueService },
        { provide: SocketGateway, useValue: mockSocketGateway },
        { provide: RagService, useValue: mockRagService },
        { provide: FlowExecutionEngine, useValue: mockFlowExecutionEngine },
        { provide: getModelToken(Workspace.name), useValue: mockWorkspaceModel },
        { provide: getModelToken(Contact.name), useValue: mockContactModel },
        { provide: getModelToken(Conversation.name), useValue: mockConversationModel },
        { provide: getModelToken(Message.name), useValue: mockMessageModel },
      ],
    }).compile();


    worker = module.get<WebhookWorker>(WebhookWorker);
  });

  describe('evaluateAndExecuteAutoReply', () => {
    it('should dispatch auto-reply when RAG confidence exceeds threshold', async () => {
      mockRagService.queryKnowledgeBase.mockResolvedValue({
        answer: 'Our business hours are 9am to 6pm.',
        confidenceScore: 0.85,
      });

      await (worker as any).evaluateAndExecuteAutoReply(
        mockWorkspace as any,
        mockConversation as any,
        mockContact as any,
        'What are your hours?',
      );

      expect(mockRagService.queryKnowledgeBase).toHaveBeenCalledWith('ws_123', 'What are your hours?');
      expect(mockMessageModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'ws_123',
          direction: 'outbound',
          body: 'Our business hours are 9am to 6pm.',
        }),
      );
      expect(mockSocketGateway.emitToWorkspace).toHaveBeenCalledWith('ws_123', 'message.sent', expect.any(Object));
    });

    it('should escalate to human agent on low RAG confidence', async () => {
      mockRagService.queryKnowledgeBase.mockResolvedValue({
        answer: 'Uncertain answer',
        confidenceScore: 0.40,
      });

      await (worker as any).evaluateAndExecuteAutoReply(
        mockWorkspace as any,
        mockConversation as any,
        mockContact as any,
        'Complex query',
      );

      expect(mockSocketGateway.emitToWorkspace).toHaveBeenCalledWith(
        'ws_123',
        'escalation.alert',
        expect.objectContaining({ sentiment: 'urgent' }),
      );
    });
  });
});
