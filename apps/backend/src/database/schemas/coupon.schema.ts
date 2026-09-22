import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CouponDocument = Coupon & Document;

@Schema({ timestamps: true })
export class Coupon {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;

  @Prop({ required: true, enum: ['percentage', 'fixed'], default: 'percentage' })
  discountType: string;

  @Prop({ required: true, min: 0 })
  discountAmount: number;

  @Prop({ required: true, enum: ['INR', 'USD', 'EUR'], default: 'INR' })
  currency: string;

  @Prop({ required: true, min: 1, default: 100 })
  maxRedemptions: number;

  @Prop({ required: true, default: 0 })
  redemptionCount: number;

  @Prop({ type: Date, default: null })
  expiresAt: Date | null;

  @Prop({ required: true, default: true })
  isActive: boolean;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);

CouponSchema.index({ code: 1 }, { unique: true });
CouponSchema.index({ isActive: 1, expiresAt: 1 });
