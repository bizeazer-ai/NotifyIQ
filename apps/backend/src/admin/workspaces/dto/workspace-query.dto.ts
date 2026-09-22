import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminWorkspaceQueryDto {
  @ApiPropertyOptional({ description: 'Search term for workspace name or slug' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by active status (true/false)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by workspace plan (free, growth, enterprise)' })
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiPropertyOptional({ description: 'Filter by workspace currency (INR, USD, EUR)' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}
