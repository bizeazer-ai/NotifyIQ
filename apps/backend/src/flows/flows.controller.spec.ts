import { Test, TestingModule } from '@nestjs/testing';
import { FlowsController } from './flows.controller.js';
import { FlowsService } from './flows.service.js';
import { FlowExecutionEngine } from './flow-execution.engine.js';
import { AuthGuard, WorkspaceGuard } from '../common/guards/index.js';

jest.mock('@notifyiq/config', () => ({
  env: { JWT_SECRET: 'test-secret' },
}));


describe('FlowsController', () => {
  let controller: FlowsController;
  let mockFlowsService: any;
  let mockFlowExecutionEngine: any;

  const mockReq: any = { workspaceId: '507f1f77bcf86cd799439011' };
  const mockFlow = { _id: 'flow_123', name: 'Test Flow', active: true };

  beforeEach(async () => {
    mockFlowsService = {
      createFlow: jest.fn().mockResolvedValue(mockFlow),
      getFlows: jest.fn().mockResolvedValue([mockFlow]),
      getFlowById: jest.fn().mockResolvedValue(mockFlow),
      updateFlow: jest.fn().mockResolvedValue(mockFlow),
      toggleFlowActive: jest.fn().mockResolvedValue({ ...mockFlow, active: true }),
      duplicateFlow: jest.fn().mockResolvedValue({ ...mockFlow, _id: 'flow_456', name: 'Test Flow (Copy)', active: false }),
      deleteFlow: jest.fn().mockResolvedValue({ deleted: true, id: 'flow_123' }),
    };

    mockFlowExecutionEngine = {
      executeFlowForInboundMessage: jest.fn().mockResolvedValue({
        executed: true,
        flowName: 'Test Flow',
        actionsTaken: ['sent_message: Hello'],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlowsController],
      providers: [
        { provide: FlowsService, useValue: mockFlowsService },
        { provide: FlowExecutionEngine, useValue: mockFlowExecutionEngine },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(WorkspaceGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FlowsController>(FlowsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create should call flowsService.createFlow', async () => {
    const res = await controller.create(mockReq, { name: 'New Flow', description: 'Desc' });
    expect(res.data).toEqual(mockFlow);
    expect(mockFlowsService.createFlow).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'New Flow', 'Desc', undefined, undefined);
  });

  it('findAll should return array of flows', async () => {
    const res = await controller.findAll(mockReq);
    expect(res.data).toEqual([mockFlow]);
    expect(mockFlowsService.getFlows).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });

  it('findOne should return single flow by ID', async () => {
    const res = await controller.findOne(mockReq, 'flow_123');
    expect(res.data).toEqual(mockFlow);
    expect(mockFlowsService.getFlowById).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'flow_123');
  });

  it('update should update flow', async () => {
    const res = await controller.update(mockReq, 'flow_123', { name: 'Updated Name' });
    expect(res.data).toEqual(mockFlow);
    expect(mockFlowsService.updateFlow).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'flow_123', { name: 'Updated Name' });
  });

  it('toggleActive should toggle active state', async () => {
    const res = await controller.toggleActive(mockReq, 'flow_123', { active: true });
    expect(res.data.active).toBe(true);
    expect(mockFlowsService.toggleFlowActive).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'flow_123', true);
  });

  it('duplicate should clone flow', async () => {
    const res = await controller.duplicate(mockReq, 'flow_123');
    expect(res.data._id).toBe('flow_456');
    expect(mockFlowsService.duplicateFlow).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'flow_123');
  });

  it('remove should delete flow', async () => {
    const res = await controller.remove(mockReq, 'flow_123');
    expect(res.data).toEqual({ deleted: true, id: 'flow_123' });
    expect(mockFlowsService.deleteFlow).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'flow_123');
  });

  it('testSimulation should run flow simulation via FlowExecutionEngine', async () => {
    const res = await controller.testSimulation(mockReq, { inputMessage: 'What is the price?' });
    expect(res.data.executed).toBe(true);
    expect(mockFlowExecutionEngine.executeFlowForInboundMessage).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      expect.any(Object),
      expect.any(Object),
      'What is the price?',
      'neutral',
    );
  });
});
