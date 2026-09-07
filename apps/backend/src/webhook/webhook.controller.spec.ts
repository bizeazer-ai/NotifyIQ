import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';

// Mock the shared config package to bypass ESM import resolution in Jest CommonJS tests
jest.mock('@notifyiq/config', () => ({
  env: {
    META_WEBHOOK_VERIFY_TOKEN: 'test-token',
    META_APP_SECRET: 'test-secret',
  },
}));

import { WebhookController } from './webhook.controller.js';
import { QueueService, QueueName } from '../queues/queue.service.js';

describe('WebhookController', () => {
  let controller: WebhookController;
  let queueService: jest.Mocked<QueueService>;

  beforeEach(async () => {
    const mockQueueService = {
      addJob: jest.fn().mockResolvedValue({ id: 'job-id' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
      ],
    }).compile();

    controller = module.get<WebhookController>(WebhookController);
    queueService = module.get(QueueService) as jest.Mocked<QueueService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('verifyWebhook (GET)', () => {
    it('should return challenge with 200 OK when tokens match', () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as Response;

      // Set environment variable in test context
      process.env.META_WEBHOOK_VERIFY_TOKEN = 'test-token';

      controller.verifyWebhook('subscribe', 'challenge-code', 'test-token', mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.send).toHaveBeenCalledWith('challenge-code');
    });

    it('should return 403 Forbidden when tokens mismatch', () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as Response;

      process.env.META_WEBHOOK_VERIFY_TOKEN = 'test-token';

      controller.verifyWebhook('subscribe', 'challenge-code', 'wrong-token', mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockResponse.send).toHaveBeenCalledWith('Verification token mismatch');
    });
  });

  describe('handleWebhook (POST)', () => {
    it('should enqueue the payload and return success', async () => {
      // Run with Mocked Services to bypass HMAC signature check in test
      process.env.MOCK_SERVICES = 'true';

      const mockReq = {
        body: { entry: [{ id: '123' }] },
      } as any;

      const result = await controller.handleWebhook(mockReq, 'sig');

      expect(queueService.addJob).toHaveBeenCalledWith(
        QueueName.WEBHOOK_PROCESSOR,
        'process-meta-event',
        mockReq.body,
      );
      expect(result).toEqual({ success: true });
    });
  });
});
