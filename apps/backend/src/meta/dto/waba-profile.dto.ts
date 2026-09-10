import { IsString, IsOptional, IsArray } from 'class-validator';

export class WabaProfileDto {
  @IsString()
  @IsOptional()
  about?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  vertical?: string;

  @IsArray()
  @IsOptional()
  websites?: string[];

  @IsString()
  @IsOptional()
  profilePictureUrl?: string;
}
