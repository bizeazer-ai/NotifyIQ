import { IsNotEmpty, IsString, IsEnum, IsNumber, Min, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCouponDto {
  @ApiProperty({ description: 'Coupon code string (e.g. PROMO2026)' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ enum: ['percentage', 'fixed'], default: 'percentage' })
  @IsEnum(['percentage', 'fixed'])
  discountType: 'percentage' | 'fixed';

  @ApiProperty({ description: 'Discount value (percentage 1-100 or fixed amount)' })
  @IsNumber()
  @Min(0)
  discountAmount: number;

  @ApiPropertyOptional({ enum: ['INR', 'USD', 'EUR'], default: 'INR' })
  @IsOptional()
  @IsEnum(['INR', 'USD', 'EUR'])
  currency?: string = 'INR';

  @ApiPropertyOptional({ description: 'Maximum redemptions allowed', default: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRedemptions?: number = 100;

  @ApiPropertyOptional({ description: 'Expiration ISO date string' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
