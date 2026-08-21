import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../data/products.service';
import { Product } from '../../data/api.types';

@Component({
  selector: 'admin-products-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between mb-lg">
      <div>
        <h1 class="text-h2 text-ink">Products</h1>
        <p class="text-body-sm text-ink-muted">{{ total() }} total</p>
      </div>
      <a routerLink="/products/new" class="admin-btn-primary">+ New product</a>
    </div>

    <div class="mb-md">
      <input
        type="search"
        [(ngModel)]="search"
        (ngModelChange)="reload()"
        placeholder="Search by name, SKU, or slug…"
        class="admin-input max-w-sm" />
    </div>

    <div class="admin-card overflow-hidden">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Category</th>
            <th class="text-right">Price</th>
            <th class="text-right">Stock</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (p of items(); track p.id) {
            <tr>
              <td class="flex items-center gap-sm">
                @if (p.images.length) {
                  <img [src]="p.images[0]" alt="" class="w-8 h-10 object-cover" />
                }
                <div>
                  <div class="text-ink font-medium">{{ p.name }}</div>
                  <div class="text-caption text-ink-subtle">/{{ p.slug }}</div>
                </div>
              </td>
              <td class="font-mono text-caption">{{ p.sku }}</td>
              <td>{{ p.category.name }}</td>
              <td class="text-right num-tabular">₹ {{ p.price.finalPrice.toLocaleString('en-IN') }}</td>
              <td class="text-right">
                <span
                  class="badge"
                  [class.badge-success]="p.stockDisplay.state === 'IN_STOCK'"
                  [class.badge-warning]="p.stockDisplay.state === 'LOW'"
                  [class.badge-danger]="p.stockDisplay.state === 'OUT_OF_STOCK'">
                  {{ p.stockDisplay.qty }}
                </span>
              </td>
              <td class="text-right">
                <a [routerLink]="['/products', p.id]" class="admin-btn">Edit</a>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="6" class="text-center text-ink-muted py-xl">No products match.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class ProductsListComponent {
  private readonly productsService = inject(ProductsService);

  search = '';
  readonly items = signal<Product[]>([]);
  readonly total = signal(0);

  constructor() {
    this.reload();
  }

  reload() {
    this.productsService.list({ search: this.search || undefined, take: 100 }).subscribe((res) => {
      this.items.set(res.items);
      this.total.set(res.total);
    });
  }
}
