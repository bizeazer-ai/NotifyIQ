import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { ApiKey, ApiKeyDocument } from '../database/schemas/api-key.schema.js';
import { CreateApiKeyDto } from './dto/create-api-key.dto.js';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectModel(ApiKey.name)
    private readonly apiKeyModel: Model<ApiKeyDocument>,
  ) {}

  /**
   * Generates a new cryptographically secure API Key for the workspace.
   * Format: nq_live_<random_hex_48>
   */
  async createApiKey(workspaceId: string, dto: CreateApiKeyDto) {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('A descriptive name for the API key is required');
    }

    const randomSecret = crypto.randomBytes(24).toString('hex');
    const secretKey = `nq_live_${randomSecret}`;
    const prefix = `nq_live_${randomSecret.slice(0, 8)}`;
    const keyHash = await bcrypt.hash(secretKey, 10);

    let expiresAt: Date | null = null;
    if (dto.expiresInDays && dto.expiresInDays > 0) {
      const now = new Date();
      now.setDate(now.getDate() + dto.expiresInDays);
      expiresAt = now;
    }

    const validScopes = ['send', 'read', 'webhook', 'all'];
    const scopes = dto.scopes && dto.scopes.length > 0
      ? dto.scopes.filter(s => validScopes.includes(s))
      : ['send', 'read', 'webhook'];

    const apiKeyRecord = await this.apiKeyModel.create({
      workspaceId,
      name: dto.name.trim(),
      keyPrefix: prefix,
      keyHash,
      scopes,
      expiresAt,
      lastUsedAt: null,
    });

    console.log(`[ApiKeysService] Created API key '${apiKeyRecord.name}' (Prefix: ${prefix}) for workspace: ${workspaceId}`);

    return {
      id: apiKeyRecord._id.toString(),
      name: apiKeyRecord.name,
      keyPrefix: apiKeyRecord.keyPrefix,
      apiKey: secretKey, // Returned ONLY on initial creation
      scopes: apiKeyRecord.scopes,
      expiresAt: apiKeyRecord.expiresAt,
      createdAt: (apiKeyRecord as any).createdAt || new Date(),
    };
  }

  /**
   * Lists all active API Keys for a workspace without exposing secret hashes.
   */
  async listApiKeys(workspaceId: string) {
    const keys = await this.apiKeyModel
      .find({ workspaceId })
      .sort({ createdAt: -1 })
      .select('-keyHash')
      .lean();

    return keys.map((k: any) => ({
      id: k._id.toString(),
      name: k.name,
      keyPrefix: k.keyPrefix,
      scopes: k.scopes || ['send', 'read'],
      lastUsedAt: k.lastUsedAt || null,
      expiresAt: k.expiresAt || null,
      createdAt: k.createdAt,
      isExpired: k.expiresAt ? new Date() > new Date(k.expiresAt) : false,
    }));
  }

  /**
   * Permanently revokes an API Key.
   */
  async revokeApiKey(workspaceId: string, keyId: string) {
    const key = await this.apiKeyModel.findOne({ _id: keyId, workspaceId });
    if (!key) {
      throw new NotFoundException('API Key not found or does not belong to this workspace');
    }

    await this.apiKeyModel.deleteOne({ _id: keyId, workspaceId });
    console.log(`[ApiKeysService] Revoked API key '${key.name}' (${key.keyPrefix}) for workspace: ${workspaceId}`);

    return {
      success: true,
      message: `API Key '${key.name}' was revoked successfully`,
      id: keyId,
    };
  }

  /**
   * Rotates an existing API Key: regenerates secret token while keeping the same ID and name.
   */
  async rotateApiKey(workspaceId: string, keyId: string) {
    const key = await this.apiKeyModel.findOne({ _id: keyId, workspaceId });
    if (!key) {
      throw new NotFoundException('API Key not found or does not belong to this workspace');
    }

    const randomSecret = crypto.randomBytes(24).toString('hex');
    const newSecretKey = `nq_live_${randomSecret}`;
    const newPrefix = `nq_live_${randomSecret.slice(0, 8)}`;
    const newKeyHash = await bcrypt.hash(newSecretKey, 10);

    key.keyPrefix = newPrefix;
    key.keyHash = newKeyHash;
    key.lastUsedAt = null;
    await key.save();

    console.log(`[ApiKeysService] Rotated API key '${key.name}' (New Prefix: ${newPrefix}) for workspace: ${workspaceId}`);

    return {
      id: key._id.toString(),
      name: key.name,
      keyPrefix: newPrefix,
      apiKey: newSecretKey, // Returned ONLY on rotation
      scopes: key.scopes,
      expiresAt: key.expiresAt,
    };
  }
}
