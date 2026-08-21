import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CategoriesService } from '../../data/categories.service';

@Component({
  selector: 'admin-categories-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-lg">
      <h1 class="text-h2 text-ink">Categories</h1>
      <p class="text-body-sm text-ink-muted">Full CRUD wiring for categories is Phase 2 — read-only for now.</p>
    </div>

    <div class="admin-card overflow-hidden">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th>Pricing mode</th>
            <th class="text-right">Products</th>
            <th class="text-right">Active</th>
          </tr>
        </thead>
        <tbody>
          @for (c of categories() ?? []; track c.id) {
            <tr>
              <td>
                <div class="text-ink font-medium">{{ c.name }}</div>
                <div class="text-caption text-ink-subtle line-clamp-1">{{ c.description }}</div>
              </td>
              <td class="font-mono text-caption">{{ c.slug }}</td>
              <td>
                <span class="badge" [class.badge-gold]="c.pricingMode === 'LIVE_METAL_RATE'">{{ c.pricingMode }}</span>
              </td>
              <td class="text-right num-tabular">{{ c._count?.products ?? 0 }}</td>
              <td class="text-right">
                <span class="badge" [class.badge-success]="c.isActive" [class.badge-danger]="!c.isActive">
                  {{ c.isActive ? 'Yes' : 'No' }}
                </span>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class CategoriesListComponent {
  private readonly categoriesService = inject(CategoriesService);
  readonly categories = toSignal(this.categoriesService.list());
}
