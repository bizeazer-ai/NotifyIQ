import { IsString, IsUrl, IsArray, IsBoolean, IsOptional, MaxLength, ArrayMaxSize } from 'class-validator';
import { VALID_EVENT_TYPES } from '../../database/schemas/outbound-webhook.schema.js';

export class RegisterWebhookDto {
  @IsString()
  @MaxLength(120)
  description: string;

  @IsUrl({ protocols: ['https', 'http'], require_tld: false })
  url: string;

  @IsArray()
  @ArrayMaxSize(20)
  @IsOptional()
  events?: string[];
}

export class UpdateWebhookDto {
  @IsString()
  @MaxLength(120)
  @IsOptional()
  description?: string;

  @IsUrl({ protocols: ['https', 'http'], require_tld: false })
  @IsOptional()
  url?: string;

  @IsArray()
  @ArrayMaxSize(20)
  @IsOptional()
  events?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export const SUPPORTED_EVENTS = VALID_EVENT_TYPES;
