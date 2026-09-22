import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Verify2FaDto {
  @ApiProperty({ description: 'Challenge token returned from login Step 1' })
  @IsString()
  @IsNotEmpty()
  challengeToken: string;

  @ApiProperty({ description: '6-digit TOTP code or emergency backup code' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
