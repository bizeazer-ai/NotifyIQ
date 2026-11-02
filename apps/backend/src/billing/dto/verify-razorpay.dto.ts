import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class VerifyRazorpayDto {
  @IsString()
  @IsNotEmpty()
  razorpay_order_id: string;

  @IsString()
  @IsNotEmpty()
  razorpay_payment_id: string;

  @IsString()
  @IsNotEmpty()
  razorpay_signature: string;

  @IsString()
  @IsOptional()
  plan?: string = 'growth';
}

