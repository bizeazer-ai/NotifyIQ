import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ContactsService } from './contacts.service.js';
import { Contact } from '../database/schemas/contact.schema.js';
import { AuditLog } from '../database/schemas/audit-log.schema.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ContactsService', () => {
  let service: ContactsService;

  const mockContact = {
    _id: 'contact_123',
    workspaceId: 'ws_123',
    name: 'John Doe',
    phone: '+919876543210',
    tags: ['Customer'],
    consentGiven: true,
  };

  const mockContactModel = {
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockContact]),
      }),
    }),
    findOne: jest.fn(),
    create: jest.fn(),
    deleteOne: jest.fn(),
  };

  const mockAuditLogModel = {
    create: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        { provide: getModelToken(Contact.name), useValue: mockContactModel },
        { provide: getModelToken(AuditLog.name), useValue: mockAuditLogModel },
      ],
    }).compile();

    service = module.get<ContactsService>(ContactsService);
  });

  describe('getContacts', () => {
    it('should query contacts scoped by workspaceId', async () => {
      const contacts = await service.getContacts('ws_123', 'John', 'Customer');
      expect(mockContactModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'ws_123',
          tags: 'Customer',
        }),
      );
      expect(contacts).toEqual([mockContact]);
    });
  });

  describe('createContact', () => {
    it('should create new contact with formatted phone number', async () => {
      mockContactModel.findOne.mockResolvedValue(null);
      mockContactModel.create.mockResolvedValue({ ...mockContact, phone: '+919876543210' });

      const res = await service.createContact('ws_123', {
        name: 'John Doe',
        phone: '9876543210',
        tags: ['VIP'],
      });

      expect(mockContactModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'ws_123',
          name: 'John Doe',
          phone: '+9876543210',
        }),
      );
      expect(res.phone).toBe('+919876543210');
    });

    it('should throw BadRequestException if phone number already exists in workspace', async () => {
      mockContactModel.findOne.mockResolvedValue(mockContact);
      await expect(
        service.createContact('ws_123', { name: 'John Doe', phone: '+919876543210' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('bulkImportCsv', () => {
    it('should parse CSV content and import valid rows', async () => {
      mockContactModel.findOne.mockResolvedValue(null);
      mockContactModel.create.mockResolvedValue(mockContact);

      const csvContent = 'Name,Phone,Tag\nAlice,+1234567890,Lead\nBob,+1987654321,VIP';
      const result = await service.bulkImportCsv('ws_123', csvContent);

      expect(result.createdCount).toBe(2);
      expect(result.skippedCount).toBe(0);
      expect(mockAuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'ws_123',
          action: 'contact.bulk_import',
        }),
      );
    });

    it('should throw BadRequestException for empty CSV', async () => {
      await expect(service.bulkImportCsv('ws_123', '  ')).rejects.toThrow(BadRequestException);
    });
  });

  describe('exportContactsCsv', () => {
    it('should format workspace contacts as CSV text', async () => {
      const mockContactsList = [
        { name: 'Alice', phone: '+123', tags: ['VIP'], consentGiven: true, createdAt: '2026-01-01' },
      ];
      mockContactModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockContactsList),
      });

      const csv = await service.exportContactsCsv('ws_123');
      expect(csv).toContain('Name,Phone,Tags,Consent,CreatedAt');
      expect(csv).toContain('"Alice","+123","VIP",true');
    });
  });

  describe('deleteContact', () => {
    it('should delete contact scoped by workspaceId', async () => {
      mockContactModel.deleteOne.mockResolvedValue({ deletedCount: 1 });
      const result = await service.deleteContact('ws_123', 'contact_123');
      expect(mockContactModel.deleteOne).toHaveBeenCalledWith({ _id: 'contact_123', workspaceId: 'ws_123' });
      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if contact to delete is missing', async () => {
      mockContactModel.deleteOne.mockResolvedValue({ deletedCount: 0 });
      await expect(service.deleteContact('ws_123', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
