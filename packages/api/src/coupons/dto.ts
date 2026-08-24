import { IsBoolean, IsDateString, IsIn, IsNumber, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator';

const CODE_RE = /^[A-Z0-9_-]{3,32}$/;

export class CreateCouponDto {
  @IsString() @Matches(CODE_RE, { message: 'code must be 3-32 chars, A-Z / 0-9 / _ / -' })
  code!: string;

  @IsOptional() @IsString() @MaxLength(300) description?: string;

  @IsString() @IsIn(['PERCENT', 'FLAT'])
  discountType!: 'PERCENT' | 'FLAT';

  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  discountValue!: number;

  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) minCartValue?: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) maxDiscount?: number;
  @IsOptional() @IsNumber() @Min(1) perCustomerCap?: number;
  @IsOptional() @IsNumber() @Min(1) totalUsageCap?: number;

  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateCouponDto {
  @IsOptional() @IsString() @Matches(CODE_RE) code?: string;
  @IsOptional() @IsString() @MaxLength(300) description?: string;
  @IsOptional() @IsString() @IsIn(['PERCENT', 'FLAT']) discountType?: 'PERCENT' | 'FLAT';
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) discountValue?: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) minCartValue?: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) maxDiscount?: number;
  @IsOptional() @IsNumber() @Min(1) perCustomerCap?: number;
  @IsOptional() @IsNumber() @Min(1) totalUsageCap?: number;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ValidateCouponDto {
  @IsString() @MinLength(3) @MaxLength(32) code!: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) cartValue!: number;
}

export interface CouponValidationResult {
  valid: boolean;
  code?: string;
  discount?: number;
  message: string;
}
