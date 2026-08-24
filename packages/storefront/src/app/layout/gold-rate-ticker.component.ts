import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MetalRatesService } from '../data/metal-rates.service';
import { RateEntry } from '../data/api.types';

interface TickerRow { label: string; value: number; unit: string; direction: 'up' | 'down' | 'flat' }

// Which combos actually appear on the ticker (in this order).
const SHOW: Array<{ metal: RateEntry['metal']; purity: RateEntry['purity']; label: string; unit: string }> = [
  { metal: 'GOLD',   purity: 'K22', label: 'Gold 22K', unit: 'g' },
  { metal: 'GOLD',   purity: 'K24', label: 'Gold 24K', unit: 'g' },
  { metal: 'SILVER', purity: 'K24', label: 'Silver',   unit: 'g' },
];

@Component({
  selector: 'sf-gold-rate-ticker',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside role="region" aria-label="Live metal rates" class="bg-bg-muted text-body-sm text-ink-muted border-b border-line">
      <div class="container-page flex items-center gap-xl overflow-x-auto py-xs">
        @for (r of rows(); track r.label) {
          <span class="whitespace-nowrap flex items-center gap-xs">
            <span class="uppercase tracking-wide text-caption text-ink-subtle">{{ r.label }}</span>
            <span class="text-ink font-medium num-tabular">₹ {{ r.value | number:'1.0-0' }} /{{ r.unit }}</span>
            <span
              [class.text-success]="r.direction === 'up'"
              [class.text-danger]="r.direction === 'down'"
              [class.text-ink-subtle]="r.direction === 'flat'"
              aria-hidden="true">
              @if (r.direction === 'up') { ▲ } @else if (r.direction === 'down') { ▼ } @else { ● }
            </span>
          </span>
        }
      </div>
    </aside>
  `,
})
export class GoldRateTickerComponent {
  private readonly ratesService = inject(MetalRatesService);
  readonly today = toSignal(this.ratesService.today(), { initialValue: null });

  readonly rows = computed<TickerRow[]>(() => {
    const t = this.today();
    if (!t) return [];
    const byKey = new Map(t.rates.map((r) => [`${r.metal}_${r.purity}`, r]));
    return SHOW.map((s) => {
      const r = byKey.get(`${s.metal}_${s.purity}`);
      return {
        label: s.label,
        value: r?.ratePerGram ?? 0,
        unit: s.unit,
        direction: r?.direction ?? 'flat',
      };
    });
  });
}
