import { IsNotEmpty, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessRefundDto {
  @ApiProperty({ description: 'Workspace ID associated with transaction' })
  @IsString()
  @IsNotEmpty()
  workspaceId: string;

  @ApiProperty({ enum: ['Stripe', 'Razorpay'], description: 'Payment gateway rail' })
  @IsEnum(['Stripe', 'Razorpay'])
  paymentGateway: 'Stripe' | 'Razorpay';

  @ApiProperty({ description: 'Transaction ID / Payment ID / Charge ID to refund' })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({ description: 'Refund amount in major currency units (or cents/paise)' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ description: 'Mandatory reason for refund (audited)' })
  @IsString()
  @IsNotEmpty()
  reasonCode: string;
}
