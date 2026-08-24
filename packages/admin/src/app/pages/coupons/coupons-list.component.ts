import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CouponsService } from '../../data/coupons.service';
import { Coupon } from '../../data/api.types';

@Component({
  selector: 'admin-coupons-list',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between mb-lg">
      <div>
        <h1 class="text-h2 text-ink">Coupons</h1>
        <p class="text-body-sm text-ink-muted">Code-based discounts applied at checkout (Phase 3 will consume these).</p>
      </div>
      <a routerLink="/coupons/new" class="admin-btn-primary">+ New coupon</a>
    </div>

    <div class="admin-card overflow-hidden">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Type</th>
            <th class="text-right">Value</th>
            <th class="text-right">Min cart</th>
            <th class="text-right">Max off</th>
            <th class="text-right">Used</th>
            <th class="text-right">Window</th>
            <th class="text-right">Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (c of coupons(); track c.id) {
            <tr>
              <td>
                <div class="font-mono text-ink font-medium">{{ c.code }}</div>
                @if (c.description) { <div class="text-caption text-ink-subtle line-clamp-1">{{ c.description }}</div> }
              </td>
              <td>
                <span class="badge" [class.badge-gold]="c.discountType === 'PERCENT'">{{ c.discountType }}</span>
              </td>
              <td class="text-right num-tabular">
                @if (c.discountType === 'PERCENT') { {{ c.discountValue }}% }
                @else { ₹ {{ +c.discountValue | number }} }
              </td>
              <td class="text-right num-tabular">
                @if (c.minCartValue) { ₹ {{ +c.minCartValue | number }} } @else { — }
              </td>
              <td class="text-right num-tabular">
                @if (c.maxDiscount) { ₹ {{ +c.maxDiscount | number }} } @else { — }
              </td>
              <td class="text-right num-tabular">
                {{ c.totalUsageCount }}@if (c.totalUsageCap) { <span class="text-ink-subtle">/{{ c.totalUsageCap }}</span> }
              </td>
              <td class="text-right text-caption text-ink-muted">
                @if (c.startsAt || c.endsAt) {
                  {{ fmt(c.startsAt) }} → {{ fmt(c.endsAt) }}
                } @else { forever }
              </td>
              <td class="text-right">
                <span class="badge" [class.badge-success]="c.isActive" [class.badge-danger]="!c.isActive">
                  {{ c.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="text-right">
                <a [routerLink]="['/coupons', c.id]" class="admin-btn">Edit</a>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="9" class="text-center text-ink-muted py-xl">No coupons yet.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class CouponsListComponent {
  private readonly couponsService = inject(CouponsService);
  readonly coupons = signal<Coupon[]>([]);

  constructor() { this.couponsService.list().subscribe((c) => this.coupons.set(c)); }

  fmt(s: string | null): string {
    if (!s) return '…';
    return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }
}
