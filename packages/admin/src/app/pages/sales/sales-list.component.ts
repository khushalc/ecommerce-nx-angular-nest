import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SalesService } from '../../data/sales.service';
import { Sale } from '../../data/api.types';

@Component({
  selector: 'admin-sales-list',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between mb-lg">
      <div>
        <h1 class="text-h2 text-ink">Events / Sales</h1>
        <p class="text-body-sm text-ink-muted">Announcement banner + optional per-product discounts. Newest active drives the banner.</p>
      </div>
      <a routerLink="/sales/new" class="admin-btn-primary">+ New event</a>
    </div>

    <div class="admin-card overflow-hidden">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Window</th>
            <th class="text-right">Default disc.</th>
            <th class="text-right">Products</th>
            <th class="text-right">Status</th>
            <th class="text-right">Banner</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (s of sales(); track s.id) {
            <tr>
              <td>
                <div class="text-ink font-medium">{{ s.name }}</div>
                @if (s.bannerLabel) {
                  <div class="text-caption text-ink-subtle line-clamp-1">{{ s.bannerLabel }}</div>
                }
              </td>
              <td class="text-caption text-ink-muted num-tabular">
                {{ fmt(s.startsAt) }} → {{ fmt(s.endsAt) }}
              </td>
              <td class="text-right num-tabular">{{ s.defaultDiscountPct != null ? s.defaultDiscountPct + '%' : '—' }}</td>
              <td class="text-right num-tabular">{{ s._count?.targets ?? 0 }}</td>
              <td class="text-right">
                <span class="badge"
                  [class.badge-success]="isLive(s)"
                  [class.badge-warning]="isFuture(s)"
                  [class.badge-danger]="isPast(s) || !s.isActive">
                  {{ statusLabel(s) }}
                </span>
              </td>
              <td class="text-right">
                <span class="badge" [class.badge-gold]="s.showInBanner">{{ s.showInBanner ? 'Yes' : 'No' }}</span>
              </td>
              <td class="text-right">
                <a [routerLink]="['/sales', s.id]" class="admin-btn">Edit</a>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="7" class="text-center text-ink-muted py-xl">No events yet.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class SalesListComponent {
  private readonly salesService = inject(SalesService);
  readonly sales = signal<Sale[]>([]);

  constructor() {
    this.salesService.list().subscribe((s) => this.sales.set(s));
  }

  fmt(s: string) {
    return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  isLive(s: Sale) {
    const now = Date.now();
    return s.isActive && new Date(s.startsAt).getTime() <= now && new Date(s.endsAt).getTime() >= now;
  }
  isFuture(s: Sale) {
    return s.isActive && new Date(s.startsAt).getTime() > Date.now();
  }
  isPast(s: Sale) {
    return new Date(s.endsAt).getTime() < Date.now();
  }
  statusLabel(s: Sale) {
    if (!s.isActive) return 'Disabled';
    if (this.isLive(s)) return 'Live';
    if (this.isFuture(s)) return 'Scheduled';
    return 'Ended';
  }
}
