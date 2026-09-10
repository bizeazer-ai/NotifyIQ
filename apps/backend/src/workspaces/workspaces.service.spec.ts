import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';

jest.mock('@notifyiq/config', () => ({
  env: { JWT_SECRET: 'test_secret' },
}));

import { WorkspacesService } from './workspaces.service.js';
import { Workspace } from '../database/schemas/workspace.schema.js';
import { AuditLog } from '../database/schemas/audit-log.schema.js';
import { NotFoundException } from '@nestjs/common';

describe('WorkspacesService Whitelabel Architecture', () => {
  let service: WorkspacesService;

  const mockParentWorkspace = {
    _id: 'parent_agency_123',
    name: 'Master Agency',
    whitelabel: {
      logoUrl: 'https://agency.com/logo.png',
      brandColor: '#2563eb',
      customDomain: 'app.agency.com',
    },
  };

  const mockSubWorkspace = {
    _id: 'sub_ws_456',
    name: 'Client Workspace',
    save: jest.fn().mockResolvedValue(true),
    markModified: jest.fn(),
    whitelabel: {
      parentAgencyId: 'parent_agency_123',
    },
  };

  const mockWorkspaceModel = {
    findById: jest.fn(),
    findOne: jest.fn(),
  };

  const mockAuditLogModel = {
    create: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.MOCK_SERVICES = 'true';

    mockSubWorkspace.whitelabel = {
      parentAgencyId: 'parent_agency_123',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        { provide: getModelToken(Workspace.name), useValue: mockWorkspaceModel },
        { provide: getModelToken(AuditLog.name), useValue: mockAuditLogModel },
      ],
    }).compile();

    service = module.get<WorkspacesService>(WorkspacesService);
  });

  describe('updateWhitelabelBranding', () => {
    it('should update workspace logoUrl, brandColor, and customDomain', async () => {
      mockWorkspaceModel.findById.mockResolvedValue(mockSubWorkspace);

      const result = await service.updateWhitelabelBranding('sub_ws_456', {
        logoUrl: 'https://client.com/logo.png',
        brandColor: '#ea580c',
        customDomain: 'portal.client.com',
      });

      expect(mockSubWorkspace.markModified).toHaveBeenCalledWith('whitelabel');
      expect(mockSubWorkspace.save).toHaveBeenCalled();
      expect(result.whitelabel?.logoUrl).toBe('https://client.com/logo.png');
    });
  });

  describe('resolveBranding', () => {
    it('should fallback to parent agency branding if sub-account has no custom branding', async () => {
      mockWorkspaceModel.findById
        .mockResolvedValueOnce(mockSubWorkspace) // sub workspace look up
        .mockResolvedValueOnce(mockParentWorkspace); // parent agency look up

      const branding = await service.resolveBranding('sub_ws_456');

      expect(branding.isSubAccountFallback).toBe(true);
      expect(branding.logoUrl).toBe('https://agency.com/logo.png');
      expect(branding.parentAgencyName).toBe('Master Agency');
    });
  });

  describe('resolveByDomain', () => {
    it('should look up workspace details by custom domain name', async () => {
      mockWorkspaceModel.findOne.mockResolvedValue(mockParentWorkspace);
      mockWorkspaceModel.findById.mockResolvedValue(mockParentWorkspace);

      const res = await service.resolveByDomain('app.agency.com');

      expect(mockWorkspaceModel.findOne).toHaveBeenCalledWith({ 'whitelabel.customDomain': 'app.agency.com' });
      expect(res.workspaceName).toBe('Master Agency');
    });

    it('should throw NotFoundException if custom domain is unregistered', async () => {
      mockWorkspaceModel.findOne.mockResolvedValue(null);
      await expect(service.resolveByDomain('unknown.domain.com')).rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyCustomDomainCname', () => {
    it('should verify CNAME DNS mapping in mock mode and update workspace', async () => {
      mockWorkspaceModel.findById.mockResolvedValue(mockSubWorkspace);

      const res = await service.verifyCustomDomainCname('sub_ws_456', 'cname.client.com');

      expect(res.success).toBe(true);
      expect(mockAuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'sub_ws_456',
          action: 'workspace.cname_verified',
        }),
      );
    });
  });
});
