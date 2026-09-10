import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@notifyiq/config', () => ({
  env: { JWT_SECRET: 'test_secret' },
}));

import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';
import { AuthGuard, WorkspaceGuard } from '../common/guards/index.js';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: jest.Mocked<AnalyticsService>;

  const mockAnalyticsService = {
    getExecutiveOverview: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [{ provide: AnalyticsService, useValue: mockAnalyticsService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(WorkspaceGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    service = module.get(AnalyticsService);
  });

  describe('getOverview', () => {
    it('should return executive overview metrics for workspace', async () => {
      const mockOverview = {
        workspaceId: 'ws_123',
        totalMessages: 100,
        deliveryRatePercent: 98.5,
        botContainmentRatePercent: 92.0,
      };
      service.getExecutiveOverview.mockResolvedValue(mockOverview as any);

      const req = { workspaceId: 'ws_123' } as any;
      const res = await controller.getOverview(req);

      expect(service.getExecutiveOverview).toHaveBeenCalledWith('ws_123');
      expect(res.data).toEqual(mockOverview);
    });
  });
});
