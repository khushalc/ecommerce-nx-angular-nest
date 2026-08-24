import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsBoolean, IsDateString, IsNumber, IsOptional, IsString, IsUUID, IsUrl, Matches, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateSaleDto {
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsString() @Matches(SLUG_RE) slug!: string;
  @IsOptional() @IsString() @MaxLength(600) description?: string;
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
  @IsOptional() @IsBoolean() isActive?: boolean;

  // Banner
  @IsOptional() @IsUrl() bannerImageUrl?: string;
  @IsOptional() @IsString() @MaxLength(200) bannerLabel?: string;
  @IsOptional() @IsString() @MaxLength(60) ctaLabel?: string;
  @IsOptional() @IsString() @MaxLength(300) ctaHref?: string;
  @IsOptional() @IsBoolean() showInBanner?: boolean;

  // Pricing
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(95) defaultDiscountPct?: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) maxDiscountPerCart?: number;
}

export class UpdateSaleDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) name?: string;
  @IsOptional() @IsString() @Matches(SLUG_RE) slug?: string;
  @IsOptional() @IsString() @MaxLength(600) description?: string;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsUrl() bannerImageUrl?: string;
  @IsOptional() @IsString() @MaxLength(200) bannerLabel?: string;
  @IsOptional() @IsString() @MaxLength(60) ctaLabel?: string;
  @IsOptional() @IsString() @MaxLength(300) ctaHref?: string;
  @IsOptional() @IsBoolean() showInBanner?: boolean;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(95) defaultDiscountPct?: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) maxDiscountPerCart?: number;
}

export class SaleTargetItem {
  @IsUUID() productId!: string;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(95) discountPctOverride?: number;
}

export class SetSaleTargetsDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => SaleTargetItem)
  targets!: SaleTargetItem[];
}

export interface ActiveBannerResponse {
  id: string;
  name: string;
  bannerLabel: string;
  bannerImageUrl: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  startsAt: Date;
  endsAt: Date;
}
