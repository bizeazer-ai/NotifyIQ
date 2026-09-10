import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@notifyiq/config', () => ({
  env: { JWT_SECRET: 'test_jwt_secret' },
}));

import { ContactsController } from './contacts.controller.js';
import { ContactsService } from './contacts.service.js';
import { AuthGuard, WorkspaceGuard } from '../common/guards/index.js';

describe('ContactsController', () => {
  let controller: ContactsController;
  let service: jest.Mocked<ContactsService>;

  const mockContactsService = {
    getContacts: jest.fn(),
    createContact: jest.fn(),
    bulkImportCsv: jest.fn(),
    exportContactsCsv: jest.fn(),
    deleteContact: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [{ provide: ContactsService, useValue: mockContactsService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(WorkspaceGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ContactsController>(ContactsController);
    service = module.get(ContactsService);
  });

  describe('getContacts', () => {
    it('should return contacts for workspace', async () => {
      const mockContacts = [{ _id: '1', name: 'John' }];
      service.getContacts.mockResolvedValue(mockContacts as any);

      const req = { workspaceId: 'ws_123' } as any;
      const res = await controller.getContacts(req, 'John', 'VIP');

      expect(service.getContacts).toHaveBeenCalledWith('ws_123', 'John', 'VIP');
      expect(res.data).toEqual(mockContacts);
    });
  });

  describe('createContact', () => {
    it('should call createContact in service', async () => {
      const mockContact = { _id: '1', name: 'John' };
      service.createContact.mockResolvedValue(mockContact as any);

      const req = { workspaceId: 'ws_123' } as any;
      const res = await controller.createContact(req, { name: 'John', phone: '+12345678' });

      expect(service.createContact).toHaveBeenCalledWith('ws_123', { name: 'John', phone: '+12345678' });
      expect(res.data).toEqual(mockContact);
    });
  });

  describe('importCsv', () => {
    it('should call bulkImportCsv in service', async () => {
      const mockRes = { createdCount: 5, skippedCount: 0, totalProcessed: 5 };
      service.bulkImportCsv.mockResolvedValue(mockRes);

      const req = { workspaceId: 'ws_123' } as any;
      const res = await controller.importCsv(req, 'Name,Phone\nJohn,+123');

      expect(service.bulkImportCsv).toHaveBeenCalledWith('ws_123', 'Name,Phone\nJohn,+123');
      expect(res.data).toEqual(mockRes);
    });
  });

  describe('deleteContact', () => {
    it('should call deleteContact in service', async () => {
      service.deleteContact.mockResolvedValue({ success: true });

      const req = { workspaceId: 'ws_123' } as any;
      const res = await controller.deleteContact(req, 'contact_123');

      expect(service.deleteContact).toHaveBeenCalledWith('ws_123', 'contact_123');
      expect(res.data.success).toBe(true);
    });
  });
});
