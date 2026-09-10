import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';

jest.mock('@notifyiq/config', () => ({
  env: {
    JWT_SECRET: 'test_secret',
    UTHO_ACCESS_KEY: 'mock_access_key',
    UTHO_SECRET_KEY: 'mock_secret_key',
  },
}));

jest.mock('archiver', () => {
  return jest.fn().mockImplementation(() => ({
    pipe: jest.fn(),
    append: jest.fn(),
    finalize: jest.fn().mockResolvedValue(true),
    on: jest.fn(),
  }));
});

jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  const { EventEmitter } = require('events');
  return {
    ...actualFs,
    existsSync: jest.fn().mockReturnValue(true),
    mkdirSync: jest.fn(),
    unlink: jest.fn((p, cb) => cb && cb(null)),
    createWriteStream: jest.fn().mockImplementation(() => {
      const emitter = new EventEmitter();
      setTimeout(() => emitter.emit('close'), 5);
      return emitter;
    }),
  };
});

import { ComplianceService } from './compliance.service.js';
import { Contact } from '../database/schemas/contact.schema.js';
import { Conversation } from '../database/schemas/conversation.schema.js';
import { Message } from '../database/schemas/message.schema.js';
import { AuditLog } from '../database/schemas/audit-log.schema.js';
import { Workspace } from '../database/schemas/workspace.schema.js';
import { NotFoundException } from '@nestjs/common';

describe('ComplianceService (DPDP & GDPR)', () => {
  let service: ComplianceService;

  const mockContact = {
    _id: 'contact_123',
    phone: '+919876543210',
    workspaceId: 'ws_123',
  };

  const mockWorkspace = {
    _id: 'ws_123',
    name: 'Test Workspace',
    slug: 'test-workspace',
  };

  const mockContactModel = {
    findOne: jest.fn(),
    deleteOne: jest.fn(),
    find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([mockContact]) }),
  };

  const mockConversationModel = {
    find: jest.fn().mockImplementation(() => {
      const res = [{ _id: 'conv_1' }];
      (res as any).lean = jest.fn().mockResolvedValue(res);
      return res;
    }),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  };

  const mockMessageModel = {
    find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 5 }),
  };

  const mockAuditLogModel = {
    create: jest.fn().mockResolvedValue({}),
    find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
  };

  const mockWorkspaceModel = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.MOCK_SERVICES = 'true';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplianceService,
        { provide: getModelToken(Contact.name), useValue: mockContactModel },
        { provide: getModelToken(Conversation.name), useValue: mockConversationModel },
        { provide: getModelToken(Message.name), useValue: mockMessageModel },
        { provide: getModelToken(AuditLog.name), useValue: mockAuditLogModel },
        { provide: getModelToken(Workspace.name), useValue: mockWorkspaceModel },
      ],
    }).compile();

    service = module.get<ComplianceService>(ComplianceService);
  });

  describe('processContactDeletion (DPDP Hard Erasure)', () => {
    it('should delete contact, messages, and conversations and log anonymized audit event', async () => {
      mockContactModel.findOne.mockResolvedValue(mockContact);
      mockContactModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const res = await service.processContactDeletion('ws_123', 'contact_123', 'user_1');

      expect(res.success).toBe(true);
      expect(res.messagesDeleted).toBe(5);
      expect(mockMessageModel.deleteMany).toHaveBeenCalled();
      expect(mockConversationModel.deleteMany).toHaveBeenCalled();
      expect(mockContactModel.deleteOne).toHaveBeenCalledWith({ _id: 'contact_123', workspaceId: 'ws_123' });
      expect(mockAuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'ws_123',
          action: 'compliance.erasure',
          details: expect.objectContaining({ anonymizedPhone: '+9198****3210' }),
        }),
      );
    });

    it('should throw NotFoundException if contact is missing in workspace', async () => {
      mockContactModel.findOne.mockResolvedValue(null);
      await expect(service.processContactDeletion('ws_123', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateExport (GDPR Data Portability)', () => {
    it('should generate zip export archive and log audit record', async () => {
      mockWorkspaceModel.findById.mockResolvedValue(mockWorkspace);

      const res = await service.generateExport('ws_123', 'user_1');

      expect(res).toHaveProperty('downloadUrl');
      expect(res).toHaveProperty('expiresAt');
      expect(mockAuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'ws_123',
          action: 'compliance.export',
        }),
      );
    });
  });
});
