import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class ProvisionWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  workspaceName: string;

  @IsEmail()
  @IsNotEmpty()
  adminEmail: string;

  @IsString()
  @IsOptional()
  plan?: string;

  @IsString()
  @IsOptional()
  parentAgencyId?: string;
}
