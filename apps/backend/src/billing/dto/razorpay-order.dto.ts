import { IsNumber, IsOptional } from 'class-validator';

export class RazorpayOrderDto {
  @IsNumber()
  @IsOptional()
  amount?: number = 3999;
}
