import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUrl, Matches, MaxLength, Min, MinLength } from 'class-validator';
import { PricingMode } from '@prisma/client';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsString()
  @Matches(SLUG_RE, { message: 'slug must be kebab-case (lowercase alphanumerics + dashes)' })
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;

  @IsEnum(PricingMode)
  pricingMode!: PricingMode;

  @IsOptional()
  @IsUrl()
  heroImageUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCategoryDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80) name?: string;
  @IsOptional() @IsString() @Matches(SLUG_RE) slug?: string;
  @IsOptional() @IsString() @MaxLength(400) description?: string;
  @IsOptional() @IsEnum(PricingMode) pricingMode?: PricingMode;
  @IsOptional() @IsUrl() heroImageUrl?: string;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
