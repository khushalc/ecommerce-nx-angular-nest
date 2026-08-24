import { ArrayNotEmpty, IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, IsUrl, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Metal, Purity } from '@prisma/client';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateProductDto {
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsString() @Matches(SLUG_RE) slug!: string;
  @IsString() @MinLength(2) @MaxLength(40) sku!: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsUUID() categoryId!: string;

  @IsOptional() @IsArray() @IsUrl({}, { each: true }) images?: string[];

  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() isFresh?: boolean;

  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(90) specialDiscount?: number;

  @IsOptional() @IsInt() @Min(0) stock?: number;
  @IsOptional() @IsInt() @Min(0) lowStockThreshold?: number;
  @IsOptional() @IsBoolean() allowBackorder?: boolean;

  // FIXED_MRP
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) mrp?: number;

  // LIVE_METAL_RATE
  @IsOptional() @IsEnum(Metal) metal?: Metal;
  @IsOptional() @IsEnum(Purity) purity?: Purity;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) weightGrams?: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100) makingPct?: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) stoneValue?: number;
}

export class UpdateProductDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) name?: string;
  @IsOptional() @IsString() @Matches(SLUG_RE) slug?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(40) sku?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsArray() @IsUrl({}, { each: true }) images?: string[];
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() isFresh?: boolean;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(90) specialDiscount?: number;
  @IsOptional() @IsInt() @Min(0) stock?: number;
  @IsOptional() @IsInt() @Min(0) lowStockThreshold?: number;
  @IsOptional() @IsBoolean() allowBackorder?: boolean;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) mrp?: number;
  @IsOptional() @IsEnum(Metal) metal?: Metal;
  @IsOptional() @IsEnum(Purity) purity?: Purity;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) weightGrams?: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100) makingPct?: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) stoneValue?: number;
}

export class UploadUrlRequestDto {
  @IsString() filename!: string;
  @IsString() @Matches(/^image\/(png|jpe?g|webp)$/) contentType!: string;
}

// ─── Bulk actions ──────────────────────────────────────────────────

export class BulkDiscountDto {
  @IsArray() @ArrayNotEmpty() @IsUUID('all', { each: true }) productIds!: string[];
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(90) pct!: number;
}

export class BulkIdsDto {
  @IsArray() @ArrayNotEmpty() @IsUUID('all', { each: true }) productIds!: string[];
}

export class BulkFlagDto {
  @IsArray() @ArrayNotEmpty() @IsUUID('all', { each: true }) productIds!: string[];
  @IsBoolean() value!: boolean;
}

export class BulkCategoryDto {
  @IsArray() @ArrayNotEmpty() @IsUUID('all', { each: true }) productIds!: string[];
  @IsUUID() categoryId!: string;
}

export interface BulkResult {
  updated: number;
}

export interface UploadUrlResponse {
  uploadUrl: string;                 // pre-signed URL (Phase 4 real; stubbed now)
  publicUrl: string;                 // where the image will live after upload
  expiresIn: number;                 // seconds
}

export interface StockDisplay {
  state: 'IN_STOCK' | 'LOW' | 'BACKORDER' | 'OUT_OF_STOCK';
  message: string;
  qty: number;
  canAddToCart: boolean;
}

export interface ProductPrice {
  pricingMode: 'LIVE_METAL_RATE' | 'FIXED_MRP';
  finalPrice: number;
  listPrice: number;
  discountPct: number;
  currency: 'INR';
  breakdown?: {
    metalRatePerGram: number;
    weightGrams: number;
    purityFactor: number;
    metalValue: number;
    makingCharge: number;
    stoneValue: number;
    subtotal: number;
  };
}
