import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';
import { Workspace } from '../database/schemas/workspace.schema.js';
import { User } from '../database/schemas/user.schema.js';
import { AuditLog } from '../database/schemas/audit-log.schema.js';
import { EmailService } from '../email/email.service.js';

// Mock config globally
jest.mock('@notifyiq/config', () => ({
  env: { JWT_SECRET: 'test-secret', CLIENT_URL: 'http://localhost:5173' },
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockUserModel: any;
  let mockWorkspaceModel: any;
  let mockAuditLogModel: any;
  let mockEmailService: any;

  beforeEach(async () => {
    mockUserModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockWorkspaceModel = {
      create: jest.fn(),
      findById: jest.fn(),
    };

    mockAuditLogModel = {
      create: jest.fn(),
    };

    mockEmailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue({ success: true, id: 'email-123' }),
      sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true, id: 'email-456' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(Workspace.name), useValue: mockWorkspaceModel },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(AuditLog.name), useValue: mockAuditLogModel },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if user already exists', async () => {
      mockUserModel.findOne.mockResolvedValue({ email: 'test@example.com' });

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
          workspaceName: 'Test Corp',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should register workspace, create unverified user, and send verification email', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockWorkspaceModel.create.mockResolvedValue({
        _id: 'ws123',
        name: 'Test Corp',
        slug: 'test-corp',
      });
      mockUserModel.create.mockResolvedValue({
        _id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        isEmailVerified: false,
      });

      const res = await service.register({
        email: 'test@example.com',
        password: 'password123',
        workspaceName: 'Test Corp',
      });

      expect(res.requiresVerification).toBe(true);
      expect(res.email).toBe('test@example.com');
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
        expect.any(String),
      );
    });
  });

  describe('verifyEmail', () => {
    it('should throw BadRequestException if token is invalid or expired', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(service.verifyEmail({ token: 'invalid-token' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should verify email and return auth token and workspace', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        isEmailVerified: false,
        emailVerificationToken: 'valid-token',
        workspaceId: 'ws123',
        save: jest.fn().mockResolvedValue(true),
      };
      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockWorkspaceModel.findById.mockResolvedValue({
        _id: 'ws123',
        name: 'Test Corp',
        slug: 'test-corp',
      });

      const res = await service.verifyEmail({ token: 'valid-token' });

      expect(mockUser.isEmailVerified).toBe(true);
      expect(mockUser.emailVerificationToken).toBeNull();
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.token).toBeDefined();
      expect(res.user.email).toBe('test@example.com');
      expect(res.workspace.id).toBe('ws123');
    });
  });

  describe('forgotPassword & resetPassword', () => {
    it('should generate reset token and send reset email', async () => {
      const mockUser = {
        email: 'test@example.com',
        name: 'Test User',
        save: jest.fn().mockResolvedValue(true),
      };
      mockUserModel.findOne.mockResolvedValue(mockUser);

      const res = await service.forgotPassword({ email: 'test@example.com' });
      expect(res.success).toBe(true);
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
        expect.any(String),
      );
    });

    it('should throw BadRequestException on invalid reset token', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'invalid-token', newPassword: 'newPassword123' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('login verification check', () => {
    it('should throw ForbiddenException if user is not verified', async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true as never));

      mockUserModel.findOne.mockResolvedValue({
        email: 'unverified@example.com',
        passwordHash: 'hashed',
        isEmailVerified: false,
      });

      await expect(
        service.login({ email: 'unverified@example.com', password: 'password123' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
