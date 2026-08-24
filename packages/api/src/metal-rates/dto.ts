import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsDateString, IsEnum, IsNumber, IsOptional, Min, ValidateNested } from 'class-validator';
import { Metal, Purity } from '@prisma/client';

export class UpsertRateItem {
  @IsEnum(Metal) metal!: Metal;
  @IsEnum(Purity) purity!: Purity;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) ratePerGram!: number;
}

export class UpsertRatesDto {
  @IsOptional() @IsDateString() date?: string;    // defaults to today (UTC)
  @IsArray() @ArrayNotEmpty() @ValidateNested({ each: true }) @Type(() => UpsertRateItem)
  rates!: UpsertRateItem[];
}

export interface RateEntry {
  metal: Metal;
  purity: Purity;
  ratePerGram: number;
  previousRate: number | null;
  direction: 'up' | 'down' | 'flat';
}

export interface TodayRatesResponse {
  date: string;                    // YYYY-MM-DD
  rates: RateEntry[];
}
