import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { FlowsService } from './flows.service.js';
import { Flow } from '../database/schemas/flow.schema.js';
import { NotFoundException } from '@nestjs/common';

describe('FlowsService', () => {
  let service: FlowsService;
  let mockFlowModel: any;

  const mockWorkspaceId = '507f1f77bcf86cd799439011';
  const mockFlowId = '507f1f77bcf86cd799439022';

  const mockFlowData = {
    _id: mockFlowId,
    workspaceId: mockWorkspaceId,
    name: 'Customer Service Flow',
    description: 'Automated intent routing flow',
    nodes: [{ id: '1', type: 'trigger', data: { label: 'Inbound' }, position: { x: 0, y: 0 } }],
    edges: [],
    active: true,
    save: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    mockFlowModel = {
      create: jest.fn().mockImplementation((dto) => Promise.resolve({ ...mockFlowData, ...dto })),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockFlowData]),
      }),
      findOne: jest.fn(),
      countDocuments: jest.fn().mockResolvedValue(0),
      updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlowsService,
        {
          provide: getModelToken(Flow.name),
          useValue: mockFlowModel,
        },
      ],
    }).compile();

    service = module.get<FlowsService>(FlowsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createFlow', () => {
    it('should create default flow set to active if first flow in workspace', async () => {
      mockFlowModel.countDocuments.mockResolvedValue(0);
      const flow = await service.createFlow(mockWorkspaceId, 'First Flow', 'Desc');

      expect(mockFlowModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: mockWorkspaceId,
          name: 'First Flow',
          active: true,
        }),
      );
      expect(flow).toBeDefined();
    });

    it('should set active to false for subsequent created flows', async () => {
      mockFlowModel.countDocuments.mockResolvedValue(1);
      await service.createFlow(mockWorkspaceId, 'Second Flow', 'Desc');

      expect(mockFlowModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Second Flow',
          active: false,
        }),
      );
    });
  });

  describe('getFlows', () => {
    it('should return array of flows for workspace', async () => {
      const flows = await service.getFlows(mockWorkspaceId);
      expect(flows).toHaveLength(1);
      expect(mockFlowModel.find).toHaveBeenCalledWith({ workspaceId: mockWorkspaceId });
    });
  });

  describe('getFlowById', () => {
    it('should return flow if found', async () => {
      mockFlowModel.findOne.mockResolvedValue(mockFlowData);
      const flow = await service.getFlowById(mockWorkspaceId, mockFlowId);
      expect(flow._id).toBe(mockFlowId);
    });

    it('should throw NotFoundException if flow is missing', async () => {
      mockFlowModel.findOne.mockResolvedValue(null);
      await expect(service.getFlowById(mockWorkspaceId, 'invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleFlowActive', () => {
    it('should deactivate other flows in workspace when activating target flow', async () => {
      const mockTarget = { ...mockFlowData, active: false, save: jest.fn().mockResolvedValue(true) };
      mockFlowModel.findOne.mockResolvedValue(mockTarget);

      const result = await service.toggleFlowActive(mockWorkspaceId, mockFlowId, true);

      expect(mockFlowModel.updateMany).toHaveBeenCalledWith(
        { workspaceId: mockWorkspaceId, _id: { $ne: mockFlowId } },
        { $set: { active: false } },
      );
      expect(result.active).toBe(true);
    });
  });

  describe('duplicateFlow', () => {
    it('should duplicate flow with (Copy) appended to name and active=false', async () => {
      mockFlowModel.findOne.mockResolvedValue(mockFlowData);
      await service.duplicateFlow(mockWorkspaceId, mockFlowId);

      expect(mockFlowModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Customer Service Flow (Copy)',
          active: false,
        }),
      );
    });
  });

  describe('deleteFlow', () => {
    it('should remove flow from database', async () => {
      mockFlowModel.findOne.mockResolvedValue(mockFlowData);
      const res = await service.deleteFlow(mockWorkspaceId, mockFlowId);

      expect(res).toEqual({ deleted: true, id: mockFlowId });
      expect(mockFlowModel.deleteOne).toHaveBeenCalledWith({ _id: mockFlowId });
    });
  });
});
