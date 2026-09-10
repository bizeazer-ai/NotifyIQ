import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { FlowExecutionEngine } from './flow-execution.engine.js';
import { Flow } from '../database/schemas/flow.schema.js';
import { Message } from '../database/schemas/message.schema.js';
import { Contact } from '../database/schemas/contact.schema.js';
import { Conversation } from '../database/schemas/conversation.schema.js';
import { SocketGateway } from '../socket/socket.gateway.js';
import { RagService } from '../ai/rag.service.js';

jest.mock('@notifyiq/config', () => ({
  env: { JWT_SECRET: 'test-secret' },
}));


describe('FlowExecutionEngine', () => {
  let engine: FlowExecutionEngine;
  let mockFlowModel: any;
  let mockMessageModel: any;
  let mockContactModel: any;
  let mockConversationModel: any;
  let mockSocketGateway: any;
  let mockRagService: any;

  const mockWorkspaceId = '507f1f77bcf86cd799439011';

  beforeEach(async () => {
    mockFlowModel = {
      findOne: jest.fn(),
    };
    mockMessageModel = {
      create: jest.fn().mockImplementation((dto) => Promise.resolve({ _id: 'msg_123', ...dto })),
    };
    mockContactModel = {};
    mockConversationModel = {};

    mockSocketGateway = {
      emitToWorkspace: jest.fn(),
    };

    mockRagService = {
      queryKnowledgeBase: jest.fn().mockResolvedValue({
        answer: 'Our pricing starts at $49/month.',
        confidenceScore: 0.95,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlowExecutionEngine,
        { provide: getModelToken(Flow.name), useValue: mockFlowModel },
        { provide: getModelToken(Message.name), useValue: mockMessageModel },
        { provide: getModelToken(Contact.name), useValue: mockContactModel },
        { provide: getModelToken(Conversation.name), useValue: mockConversationModel },
        { provide: SocketGateway, useValue: mockSocketGateway },
        { provide: RagService, useValue: mockRagService },
      ],
    }).compile();

    engine = module.get<FlowExecutionEngine>(FlowExecutionEngine);
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  it('should return executed=false if no active flow exists', async () => {
    mockFlowModel.findOne.mockResolvedValue(null);
    const mockConv: any = { _id: 'conv_1' };
    const mockContact: any = { _id: 'contact_1' };

    const result = await engine.executeFlowForInboundMessage(mockWorkspaceId, mockConv, mockContact, 'Hello');
    expect(result.executed).toBe(false);
    expect(result.reason).toBe('no_active_flow');
  });

  it('should execute trigger -> send_message -> action nodes in sequence', async () => {
    const mockActiveFlow = {
      _id: 'flow_123',
      name: 'Welcome Flow',
      active: true,
      nodes: [
        { id: '1', type: 'trigger', data: { label: 'Inbound', triggerType: 'any_message' }, position: { x: 0, y: 0 } },
        { id: '2', type: 'send_message', data: { label: 'Send Welcome', messageText: 'Welcome to NotifyIQ!' }, position: { x: 0, y: 100 } },
        { id: '3', type: 'action', data: { label: 'Tag Lead', actionType: 'add_tag', tagName: 'new_lead' }, position: { x: 0, y: 200 } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' },
      ],
    };

    mockFlowModel.findOne.mockResolvedValue(mockActiveFlow);
    const mockConv: any = { _id: 'conv_123', sentiment: 'neutral', save: jest.fn() };
    const mockContact: any = { _id: 'contact_123', tags: [], save: jest.fn().mockResolvedValue(true) };

    const result = await engine.executeFlowForInboundMessage(mockWorkspaceId, mockConv, mockContact, 'Hello there');

    expect(result.executed).toBe(true);
    expect(result.nodesExecuted).toEqual(['1', '2', '3']);
    expect(result.actionsTaken).toContain('sent_message: Welcome to NotifyIQ!');
    expect(result.actionsTaken).toContain('action_add_tag: new_lead');
    expect(mockMessageModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        body: 'Welcome to NotifyIQ!',
        direction: 'outbound',
      }),
    );
    expect(mockSocketGateway.emitToWorkspace).toHaveBeenCalledWith(
      mockWorkspaceId,
      'message.sent',
      expect.any(Object),
    );
  });

  it('should evaluate condition node routes based on sentiment match', async () => {
    const mockConditionalFlow = {
      _id: 'flow_456',
      name: 'Sentiment Router Flow',
      active: true,
      nodes: [
        { id: '1', type: 'trigger', data: { label: 'Inbound' }, position: { x: 0, y: 0 } },
        { id: '2', type: 'condition', data: { label: 'Check Sentiment', conditionType: 'sentiment' }, position: { x: 0, y: 100 } },
        { id: '3', type: 'send_message', data: { label: 'Happy Response', messageText: 'Glad to hear that!' }, position: { x: -100, y: 200 } },
        { id: '4', type: 'human_handoff', data: { label: 'Escalate Urgent', reason: 'Angry customer' }, position: { x: 100, y: 200 } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3', label: 'positive' },
        { id: 'e2-4', source: '2', target: '4', label: 'urgent' },
      ],
    };

    mockFlowModel.findOne.mockResolvedValue(mockConditionalFlow);
    const mockConv: any = { _id: 'conv_456', sentiment: 'urgent', save: jest.fn().mockResolvedValue(true) };
    const mockContact: any = { _id: 'contact_456', tags: [], save: jest.fn() };

    const result = await engine.executeFlowForInboundMessage(mockWorkspaceId, mockConv, mockContact, 'I am furious!', 'urgent');

    expect(result.executed).toBe(true);
    expect(result.nodesExecuted).toEqual(['1', '2', '4']);
    expect(result.actionsTaken).toContain('human_handoff: Angry customer');
    expect(mockSocketGateway.emitToWorkspace).toHaveBeenCalledWith(
      mockWorkspaceId,
      'escalation.alert',
      expect.any(Object),
    );
  });
});
