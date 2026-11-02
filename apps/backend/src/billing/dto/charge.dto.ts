import { IsString, IsOptional, IsIn, IsObject } from 'class-validator';

export class ChargeDto {
  @IsString()
  @IsIn(['razorpay', 'stripe'])
  gateway: 'razorpay' | 'stripe' = 'razorpay';

  @IsString()
  @IsOptional()
  plan?: string = 'growth';

  @IsString()
  @IsOptional()
  paymentMethodId?: string;

  @IsObject()
  @IsOptional()
  newMethod?: {
    type: 'card' | 'upi' | 'bank_transfer';
    brand?: string;
    last4?: string;
    expiryMonth?: string;
    expiryYear?: string;
    upiId?: string;
    holderName?: string;
    saveForFuture?: boolean;
  };
}

