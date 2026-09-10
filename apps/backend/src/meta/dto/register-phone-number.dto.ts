import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RegisterPhoneNumberDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  displayName: string;

  @IsString()
  @IsOptional()
  countryCode?: string;
}
