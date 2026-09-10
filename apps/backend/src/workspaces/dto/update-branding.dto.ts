import { IsString, IsOptional } from 'class-validator';

export class UpdateBrandingDto {
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  brandColor?: string;

  @IsString()
  @IsOptional()
  customCss?: string;

  @IsString()
  @IsOptional()
  customDomain?: string;
}
