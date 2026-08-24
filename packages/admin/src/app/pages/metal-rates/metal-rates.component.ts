import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MetalRatesService } from '../../data/metal-rates.service';
import { Metal, Purity, RateEntry, UpsertRateItem } from '../../data/api.types';

interface RateRow {
  metal: Metal;
  purity: Purity;
  ratePerGram: number;
  previousRate: number | null;
  direction: 'up' | 'down' | 'flat';
  dirty: boolean;
}

@Component({
  selector: 'admin-metal-rates',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between mb-lg">
      <div>
        <h1 class="text-h2 text-ink">Metal rates — {{ date() }}</h1>
        <p class="text-body-sm text-ink-muted">
          These drive the storefront ticker and LIVE_METAL_RATE product pricing. Empty rows fall back to
          the static default × purity factor (K22 = 24K × 0.916, K18 = × 0.75, K14 = × 0.585).
        </p>
      </div>
      <button type="button" class="admin-btn-primary" [disabled]="saving() || !dirtyRows().length" (click)="save()">
        {{ saving() ? 'Saving…' : 'Save changes' }}
      </button>
    </div>

    @if (note(); as n) {
      <p class="mb-md text-body-sm" [class.text-success]="n.kind === 'ok'" [class.text-danger]="n.kind === 'err'">
        {{ n.text }}
      </p>
    }

    <div class="admin-card overflow-hidden">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Metal</th>
            <th>Purity</th>
            <th class="text-right">Yesterday</th>
            <th class="text-right">Today (₹/g)</th>
            <th class="text-right">Direction</th>
          </tr>
        </thead>
        <tbody>
          @for (r of rows(); track r.metal + r.purity) {
            <tr>
              <td class="font-medium">{{ r.metal }}</td>
              <td>{{ r.purity }}</td>
              <td class="text-right num-tabular text-ink-muted">
                @if (r.previousRate != null) { ₹ {{ r.previousRate | number }} } @else { — }
              </td>
              <td class="text-right">
                <input
                  type="number" min="0" step="0.01"
                  class="admin-input num-tabular w-32 text-right ml-auto"
                  [class.border-accent]="r.dirty"
                  [ngModel]="r.ratePerGram"
                  (ngModelChange)="onChange(r.metal, r.purity, $event)" />
              </td>
              <td class="text-right">
                <span
                  [class.text-success]="r.direction === 'up'"
                  [class.text-danger]="r.direction === 'down'"
                  [class.text-ink-muted]="r.direction === 'flat'">
                  @if (r.direction === 'up') { ▲ up }
                  @else if (r.direction === 'down') { ▼ down }
                  @else { ● flat }
                </span>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class MetalRatesComponent {
  private readonly service = inject(MetalRatesService);

  readonly date = signal('…');
  readonly rows = signal<RateRow[]>([]);
  readonly saving = signal(false);
  readonly note = signal<{ kind: 'ok' | 'err'; text: string } | null>(null);

  constructor() { this.load(); }

  private load() {
    this.service.today().subscribe((res) => {
      this.date.set(res.date);
      this.rows.set(res.rates.map((r: RateEntry) => ({
        metal: r.metal, purity: r.purity,
        ratePerGram: r.ratePerGram, previousRate: r.previousRate, direction: r.direction,
        dirty: false,
      })));
    });
  }

  onChange(metal: Metal, purity: Purity, value: number) {
    const rows = this.rows();
    const idx = rows.findIndex((r) => r.metal === metal && r.purity === purity);
    if (idx === -1) return;
    const updated = [...rows];
    updated[idx] = { ...updated[idx], ratePerGram: Number(value), dirty: true };
    this.rows.set(updated);
  }

  dirtyRows(): RateRow[] { return this.rows().filter((r) => r.dirty); }

  save() {
    const dirty = this.dirtyRows();
    if (!dirty.length) return;
    this.saving.set(true);
    this.note.set(null);

    const payload: UpsertRateItem[] = dirty.map((r) => ({
      metal: r.metal, purity: r.purity, ratePerGram: r.ratePerGram,
    }));

    this.service.upsert(undefined, payload).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.note.set({ kind: 'ok', text: `${res.updated} rate(s) saved for ${res.date}` });
        this.load();
        setTimeout(() => this.note.set(null), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.note.set({ kind: 'err', text: err?.error?.message ?? 'Save failed' });
      },
    });
  }
}
