import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, Min } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty({ message: 'API key name is required' })
  name: string;

  @IsArray()
  @IsOptional()
  scopes?: string[];

  @IsNumber()
  @IsOptional()
  @Min(1)
  expiresInDays?: number;
}
