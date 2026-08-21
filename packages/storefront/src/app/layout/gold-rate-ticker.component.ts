import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';

interface Rate { label: string; value: number; unit: string; direction: 'up' | 'down' | 'flat' }

// Phase 1: static rates (matches API pricing fallback). Phase 2: wire to /api/public/gold-rate.
@Component({
  selector: 'sf-gold-rate-ticker',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-bg-muted text-body-sm text-ink-muted border-b border-line">
      <div class="container-page flex items-center gap-xl overflow-x-auto py-xs">
        @for (r of rates; track r.label) {
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
    </div>
  `,
})
export class GoldRateTickerComponent {
  // ordering: 22K → 24K → silver
  readonly rates: Rate[] = [
    { label: 'Gold 22K', value: 6841, unit: 'g', direction: 'up' },
    { label: 'Gold 24K', value: 7465, unit: 'g', direction: 'up' },
    { label: 'Silver',   value:   94, unit: 'g', direction: 'down' },
  ];
}
