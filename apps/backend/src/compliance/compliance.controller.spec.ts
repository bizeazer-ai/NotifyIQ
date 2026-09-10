import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@notifyiq/config', () => ({
  env: { JWT_SECRET: 'test_secret' },
}));

jest.mock('archiver', () => {
  return jest.fn().mockImplementation(() => ({
    pipe: jest.fn(),
    append: jest.fn(),
    finalize: jest.fn().mockResolvedValue(true),
    on: jest.fn((event, cb) => {
      if (event === 'close') cb();
    }),
  }));
});

import { ComplianceController } from './compliance.controller.js';
import { ComplianceService } from './compliance.service.js';
import { AuthGuard, WorkspaceGuard } from '../common/guards/index.js';

describe('ComplianceController', () => {
  let controller: ComplianceController;
  let service: jest.Mocked<ComplianceService>;

  const mockComplianceService = {
    processContactDeletion: jest.fn(),
    generateExport: jest.fn(),
    getContacts: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComplianceController],
      providers: [{ provide: ComplianceService, useValue: mockComplianceService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(WorkspaceGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ComplianceController>(ComplianceController);
    service = module.get(ComplianceService);
  });

  describe('deleteContact', () => {
    it('should invoke processContactDeletion in service', async () => {
      service.processContactDeletion.mockResolvedValue({ success: true, messagesDeleted: 10 });

      const req = { workspaceId: 'ws_123', user: { userId: 'user_1' } } as any;
      const res = await controller.deleteContact(req, 'contact_123');

      expect(service.processContactDeletion).toHaveBeenCalledWith('ws_123', 'contact_123', 'user_1');
      expect(res.data.success).toBe(true);
    });
  });

  describe('exportData', () => {
    it('should invoke generateExport in service', async () => {
      const mockResult = { downloadUrl: '/api/download', expiresAt: new Date() };
      service.generateExport.mockResolvedValue(mockResult);

      const req = { workspaceId: 'ws_123', user: { userId: 'user_1' } } as any;
      const res = await controller.exportData(req);

      expect(service.generateExport).toHaveBeenCalledWith('ws_123', 'user_1');
      expect(res.data).toEqual(mockResult);
    });
  });
});
