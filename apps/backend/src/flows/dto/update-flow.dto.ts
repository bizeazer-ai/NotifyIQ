import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class UpdateFlowDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  nodes?: any[];

  @IsArray()
  @IsOptional()
  edges?: any[];

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
