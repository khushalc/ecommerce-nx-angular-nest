import { Injectable } from '@nestjs/common';
import { Metal, Purity } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RateEntry, TodayRatesResponse, UpsertRatesDto } from './dto';

// Same fallback set as pricing.ts uses when the DB has nothing for today.
const FALLBACK_RATES: Record<Metal, number> = {
  GOLD:     7465,
  SILVER:     94,
  PLATINUM: 3200,
};

// All combos we show on the ticker + power pricing.
const COMBOS: Array<{ metal: Metal; purity: Purity }> = [
  { metal: Metal.GOLD,     purity: Purity.K22 },
  { metal: Metal.GOLD,     purity: Purity.K24 },
  { metal: Metal.GOLD,     purity: Purity.K18 },
  { metal: Metal.GOLD,     purity: Purity.K14 },
  { metal: Metal.SILVER,   purity: Purity.K24 },
  { metal: Metal.PLATINUM, purity: Purity.K24 },
];

/** Pretty rate map keyed by "METAL_PURITY" for O(1) lookup by pricing engine. */
export type RateMap = Map<string, number>;
export const rateKey = (m: Metal, p: Purity) => `${m}_${p}`;

@Injectable()
export class MetalRatesService {
  constructor(private readonly prisma: PrismaService) {}

  private startOfUtcDay(d = new Date()): Date {
    const day = new Date(d);
    day.setUTCHours(0, 0, 0, 0);
    return day;
  }

  private addDays(d: Date, days: number): Date {
    const out = new Date(d);
    out.setUTCDate(out.getUTCDate() + days);
    return out;
  }

  private fmtDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  private applyPurityFactor(baseRatePerGram: number, purity: Purity): number {
    // For GOLD, DB stores the 24K reference; other purities derive by factor.
    // For SILVER / PLATINUM the stored rate is used as-is.
    // Admin can override any combo explicitly.
    const factor: Record<Purity, number> = { K14: 0.585, K18: 0.750, K22: 0.916, K24: 0.999 };
    return Math.round(baseRatePerGram * factor[purity]);
  }

  /**
   * Latest rate on/before `date` for the given metal+purity. Falls back to
   * static default × purity factor for gold if no row exists.
   */
  async getRate(metal: Metal, purity: Purity, date = new Date()): Promise<number> {
    const day = this.startOfUtcDay(date);
    const row = await this.prisma.metalRateDaily.findFirst({
      where: { metal, purity, date: { lte: day } },
      orderBy: { date: 'desc' },
    });
    if (row) return Number(row.ratePerGram);

    // No explicit row; use static fallback (per purity for gold, raw for others)
    if (metal === Metal.GOLD) return this.applyPurityFactor(FALLBACK_RATES.GOLD, purity);
    return FALLBACK_RATES[metal];
  }

  /** Full rate map for today (used by the pricing engine per request). */
  async getRateMap(date = new Date()): Promise<RateMap> {
    const map: RateMap = new Map();
    // One query, all combos we care about.
    const day = this.startOfUtcDay(date);
    const rows = await this.prisma.metalRateDaily.findMany({
      where: { date: { lte: day } },
      orderBy: { date: 'desc' },
    });
    const seen = new Set<string>();
    for (const r of rows) {
      const key = rateKey(r.metal, r.purity);
      if (seen.has(key)) continue;
      seen.add(key);
      map.set(key, Number(r.ratePerGram));
    }
    // Fill missing with fallback
    for (const c of COMBOS) {
      const key = rateKey(c.metal, c.purity);
      if (!map.has(key)) {
        map.set(key, c.metal === Metal.GOLD ? this.applyPurityFactor(FALLBACK_RATES.GOLD, c.purity) : FALLBACK_RATES[c.metal]);
      }
    }
    return map;
  }

  // ── Public endpoint ─────────────────────────────────────────────────

  async getToday(): Promise<TodayRatesResponse> {
    const today = this.startOfUtcDay();
    const yesterday = this.addDays(today, -1);

    const [todayMap, yestMap] = await Promise.all([
      this.getRateMap(today),
      this.getRateMap(yesterday),
    ]);

    const rates: RateEntry[] = COMBOS.map((c) => {
      const now = todayMap.get(rateKey(c.metal, c.purity)) ?? 0;
      const prev = yestMap.get(rateKey(c.metal, c.purity)) ?? null;
      const direction: 'up' | 'down' | 'flat' =
        prev == null || prev === now ? 'flat' : now > prev ? 'up' : 'down';
      return { metal: c.metal, purity: c.purity, ratePerGram: now, previousRate: prev, direction };
    });

    return { date: this.fmtDate(today), rates };
  }

  // ── Admin ──────────────────────────────────────────────────────────

  listRecent(limit = 30) {
    return this.prisma.metalRateDaily.findMany({
      orderBy: [{ date: 'desc' }],
      take: Math.min(limit, 90),
    });
  }

  async upsertBatch(dto: UpsertRatesDto) {
    const day = this.startOfUtcDay(dto.date ? new Date(dto.date) : new Date());

    const results = await this.prisma.$transaction(
      dto.rates.map((r) =>
        this.prisma.metalRateDaily.upsert({
          where: { date_metal_purity: { date: day, metal: r.metal, purity: r.purity } },
          create: { date: day, metal: r.metal, purity: r.purity, ratePerGram: r.ratePerGram },
          update: { ratePerGram: r.ratePerGram },
        }),
      ),
    );

    return { date: this.fmtDate(day), updated: results.length };
  }
}
