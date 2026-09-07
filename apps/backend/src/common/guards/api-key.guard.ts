import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import bcrypt from 'bcrypt';
import { ApiKey, ApiKeyDocument } from '../../database/schemas/api-key.schema.js';
import { AuthenticatedRequest } from './auth.guard.js';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @InjectModel(ApiKey.name)
    private readonly apiKeyModel: Model<ApiKeyDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const apiKey = request.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedException('API Key is missing');
    }

    // Extract prefix from format: e.g., nq_live_12345678abcdef...
    // Let's assume prefix is the first 16 characters or we can extract the first segment
    // Let's split by underscore or take first 16 characters. 
    // Usually prefixes are like: nq_live_abc12345
    // Let's split by '_' or extract the first 16 characters which would cover "nq_live_abc12345"
    let prefix = '';
    if (apiKey.includes('_')) {
      const parts = apiKey.split('_');
      // e.g. ["nq", "live", "abc12345"]
      prefix = parts.slice(0, 3).join('_'); // prefix is "nq_live_abc12345"
    } else {
      prefix = apiKey.slice(0, 16);
    }

    const keyRecord = await this.apiKeyModel.findOne({ keyPrefix: prefix });
    if (!keyRecord) {
      throw new UnauthorizedException('Invalid API Key prefix');
    }

    // Check expiration
    if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
      throw new UnauthorizedException('API Key has expired');
    }

    // Verify hash
    const isMatch = await bcrypt.compare(apiKey, keyRecord.keyHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid API Key credentials');
    }

    // Track usage asynchronously without blocking response
    this.apiKeyModel.updateOne(
      { _id: keyRecord._id },
      { $set: { lastUsedAt: new Date() } }
    ).catch(err => console.error('Failed to update API Key lastUsedAt:', err));

    // Populate context on request
    request.workspaceId = keyRecord.workspaceId.toString();
    request.apiKey = {
      id: keyRecord._id.toString(),
      name: keyRecord.name,
      scopes: keyRecord.scopes,
    };

    return true;
  }
}
