import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AuthService } from './auth.service.js';
import { Workspace } from '../database/schemas/workspace.schema.js';
import { User } from '../database/schemas/user.schema.js';
import { AuditLog } from '../database/schemas/audit-log.schema.js';

// Mock config globally
jest.mock('@notifyiq/config', () => ({
  env: { JWT_SECRET: 'test-secret' },
}));

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const mockModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(Workspace.name), useValue: mockModel },
        { provide: getModelToken(User.name), useValue: mockModel },
        { provide: getModelToken(AuditLog.name), useValue: mockModel },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
