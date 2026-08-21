import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ProductsService } from '../../data/products.service';
import { CategoriesService } from '../../data/categories.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-xl">
      <h1 class="text-h2 text-ink">Welcome back, {{ auth.user()?.fullName }}</h1>
      <p class="text-body-sm text-ink-muted">Quick overview of your catalog.</p>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-lg mb-xl">
      @for (s of stats(); track s.label) {
        <div class="admin-card p-lg">
          <p class="text-caption uppercase tracking-wide text-ink-muted">{{ s.label }}</p>
          <p class="text-h2 text-ink mt-xs num-tabular">{{ s.value }}</p>
        </div>
      }
    </div>

    <div class="admin-card p-lg">
      <h2 class="text-h4 text-ink mb-md">Quick actions</h2>
      <div class="flex flex-wrap gap-sm">
        <a routerLink="/products" class="admin-btn">All products</a>
        <a routerLink="/products/new" class="admin-btn-primary">+ New product</a>
        <a routerLink="/categories" class="admin-btn">Manage categories</a>
      </div>
    </div>
  `,
})
export class DashboardComponent {
  readonly auth = inject(AuthService);
  private readonly products = inject(ProductsService);
  private readonly categories = inject(CategoriesService);

  private readonly productList = toSignal(this.products.list({ take: 100 }));
  private readonly categoryList = toSignal(this.categories.list());

  stats() {
    const products = this.productList();
    const categories = this.categoryList();

    return [
      { label: 'Products',     value: products?.total ?? '—' },
      { label: 'Categories',   value: categories?.length ?? '—' },
      { label: 'Fresh',        value: products?.items.filter(p => p.isFresh).length ?? '—' },
      { label: 'Out of stock', value: products?.items.filter(p => p.stockDisplay.state === 'OUT_OF_STOCK').length ?? '—' },
    ];
  }
}
