import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@notifyiq/config', () => ({
  env: {
    JWT_SECRET: 'test_jwt_secret',
    ENCRYPTION_KEY: '12345678901234567890123456789012',
  },
}));

import { MetaController } from './meta.controller.js';
import { MetaService } from './meta.service.js';
import { AuthGuard, WorkspaceGuard } from '../common/guards/index.js';

describe('MetaController', () => {
  let controller: MetaController;
  let service: jest.Mocked<MetaService>;

  const mockMetaService = {
    createTemplate: jest.fn(),
    getTemplates: jest.fn(),
    deleteTemplate: jest.fn(),
    getWabaStatus: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetaController],
      providers: [{ provide: MetaService, useValue: mockMetaService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(WorkspaceGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MetaController>(MetaController);
    service = module.get(MetaService);
  });

  describe('createTemplate', () => {
    it('should pass template payload to service', async () => {
      const mockResult = { id: 'tpl_101', status: 'APPROVED' };
      service.createTemplate.mockResolvedValue(mockResult as any);

      const req = { workspaceId: 'ws_123' } as any;
      const dto = {
        name: 'welcome_template',
        category: 'UTILITY' as const,
        language: 'en_US',
        bodyText: 'Welcome {{1}}!',
      };

      const res = await controller.createTemplate(req, dto);

      expect(service.createTemplate).toHaveBeenCalledWith('ws_123', dto);
      expect(res.data).toEqual(mockResult);
    });
  });

  describe('getTemplates', () => {
    it('should fetch workspace templates', async () => {
      const mockTemplates = [{ name: 'welcome_template' }];
      service.getTemplates.mockResolvedValue(mockTemplates as any);

      const req = { workspaceId: 'ws_123' } as any;
      const res = await controller.getTemplates(req);

      expect(service.getTemplates).toHaveBeenCalledWith('ws_123');
      expect(res.data).toEqual(mockTemplates);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete specified template', async () => {
      service.deleteTemplate.mockResolvedValue({ success: true });

      const req = { workspaceId: 'ws_123' } as any;
      const res = await controller.deleteTemplate(req, 'welcome_template');

      expect(service.deleteTemplate).toHaveBeenCalledWith('ws_123', 'welcome_template');
      expect(res.data.success).toBe(true);
    });
  });
});
