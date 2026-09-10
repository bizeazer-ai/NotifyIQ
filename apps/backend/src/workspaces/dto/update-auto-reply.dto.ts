import { IsBoolean, IsOptional, IsNumber } from 'class-validator';

export class UpdateAutoReplyDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsNumber()
  @IsOptional()
  confidenceThreshold?: number;

  @IsBoolean()
  @IsOptional()
  fallbackToHuman?: boolean;
}
