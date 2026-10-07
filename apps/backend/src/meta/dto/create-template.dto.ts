import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TemplateButtonDto {
  @IsString()
  @IsNotEmpty()
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsOptional()
  value?: string;
}

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';

  @IsString()
  @IsNotEmpty()
  language: string;

  @IsString()
  @IsOptional()
  headerType?: 'NONE' | 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO';

  @IsString()
  @IsOptional()
  headerText?: string;

  @IsString()
  @IsOptional()
  headerUrl?: string;

  @IsString()
  @IsNotEmpty()
  bodyText: string;

  @IsString()
  @IsOptional()
  footerText?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TemplateButtonDto)
  buttons?: TemplateButtonDto[];
}

