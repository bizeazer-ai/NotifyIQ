import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyStripeDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

