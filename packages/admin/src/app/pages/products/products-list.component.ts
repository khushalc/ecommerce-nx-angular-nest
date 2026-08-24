import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProductsService } from '../../data/products.service';
import { CategoriesService } from '../../data/categories.service';
import { Category, Product } from '../../data/api.types';

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

    <!-- Filters row -->
    <div class="flex flex-wrap items-end gap-md mb-md">
      <div class="flex-1 min-w-64">
        <label class="admin-label">Search</label>
        <input type="search" [(ngModel)]="search" (ngModelChange)="reload()" placeholder="Name, SKU, or slug…" class="admin-input" />
      </div>
      <div>
        <label class="admin-label">Category</label>
        <select [(ngModel)]="categoryFilter" (ngModelChange)="reload()" class="admin-input min-w-48">
          <option value="">All categories</option>
          @for (c of categoryOptions(); track c.id) {
            <option [value]="c.id">{{ c.indent }}{{ c.name }}</option>
          }
        </select>
      </div>
      <div class="flex gap-sm">
        <label class="flex items-center gap-xs text-body-sm">
          <input type="checkbox" [(ngModel)]="freshOnly" (ngModelChange)="applyClientFilters()" /> Fresh only
        </label>
        <label class="flex items-center gap-xs text-body-sm">
          <input type="checkbox" [(ngModel)]="inactiveOnly" (ngModelChange)="applyClientFilters()" /> Inactive only
        </label>
      </div>
    </div>

    <!-- Bulk actions bar (shown when at least 1 selected) -->
    @if (selectedIds().size > 0) {
      <div class="admin-card p-md mb-md flex flex-wrap items-center gap-sm bg-bg-muted border-accent">
        <span class="text-body-sm font-medium mr-sm">{{ selectedIds().size }} selected</span>

        <button type="button" class="admin-btn" (click)="openDiscountDialog()">Apply discount %</button>
        <button type="button" class="admin-btn" (click)="runBulk('clear-discount')">Clear discount</button>
        <button type="button" class="admin-btn" (click)="runBulk('fresh-on')">Mark fresh</button>
        <button type="button" class="admin-btn" (click)="runBulk('fresh-off')">Un-fresh</button>
        <button type="button" class="admin-btn" (click)="runBulk('activate')">Activate</button>
        <button type="button" class="admin-btn text-danger" (click)="runBulk('deactivate')">Deactivate</button>
        <button type="button" class="admin-btn" (click)="openCategoryDialog()">Move category…</button>

        <span class="flex-1"></span>
        <button type="button" class="admin-btn" (click)="clearSelection()">Clear selection</button>
      </div>
    }

    @if (bulkNote(); as n) {
      <p class="mb-md text-body-sm" [class.text-success]="n.kind === 'ok'" [class.text-danger]="n.kind === 'err'">
        {{ n.text }}
      </p>
    }

    <div class="admin-card overflow-hidden">
      <table class="admin-table">
        <thead>
          <tr>
            <th class="w-10">
              <input type="checkbox" [checked]="allVisibleSelected()" (change)="toggleSelectAll($event)" aria-label="Select all" />
            </th>
            <th>Product</th>
            <th>SKU</th>
            <th>Category</th>
            <th class="text-right">Price</th>
            <th class="text-right">Discount</th>
            <th class="text-right">Stock</th>
            <th class="text-right">Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (p of visible(); track p.id) {
            <tr>
              <td>
                <input type="checkbox" [checked]="selectedIds().has(p.id)" (change)="toggleOne(p.id)" [attr.aria-label]="'Select ' + p.name" />
              </td>
              <td class="flex items-center gap-sm">
                @if (p.images.length) {
                  <img [src]="p.images[0]" alt="" class="w-8 h-10 object-cover" />
                }
                <div>
                  <div class="text-ink font-medium">
                    {{ p.name }}
                    @if (p.isFresh) { <span class="badge badge-gold ml-xs">Fresh</span> }
                  </div>
                  <div class="text-caption text-ink-subtle">/{{ p.slug }}</div>
                </div>
              </td>
              <td class="font-mono text-caption">{{ p.sku }}</td>
              <td>{{ p.category.name }}</td>
              <td class="text-right num-tabular">₹ {{ p.price.finalPrice.toLocaleString('en-IN') }}</td>
              <td class="text-right num-tabular">
                @if (p.price.discountPct > 0) {
                  <span [class.text-info]="p.sale" [class.text-warning]="!p.sale">
                    {{ p.price.discountPct }}%
                    @if (p.sale) { <span class="text-caption text-ink-subtle">({{ p.sale.name }})</span> }
                  </span>
                } @else { — }
              </td>
              <td class="text-right">
                <span class="badge"
                  [class.badge-success]="p.stockDisplay.state === 'IN_STOCK'"
                  [class.badge-warning]="p.stockDisplay.state === 'LOW'"
                  [class.badge-danger]="p.stockDisplay.state === 'OUT_OF_STOCK'">
                  {{ p.stockDisplay.qty }}
                </span>
              </td>
              <td class="text-right">
                <span class="badge" [class.badge-success]="p.isActive" [class.badge-danger]="!p.isActive">
                  {{ p.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="text-right">
                <a [routerLink]="['/products', p.id]" class="admin-btn">Edit</a>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="9" class="text-center text-ink-muted py-xl">No products match.</td></tr>
          }
        </tbody>
      </table>
    </div>

    <!-- Discount dialog (native) -->
    @if (discountDialogOpen()) {
      <div class="fixed inset-0 bg-ink/50 z-40 flex items-center justify-center p-lg" (click)="discountDialogOpen.set(false)">
        <div class="admin-card p-lg max-w-sm w-full" (click)="$event.stopPropagation()">
          <h3 class="text-h4 mb-md">Apply discount</h3>
          <p class="text-body-sm text-ink-muted mb-sm">Set special discount % on {{ selectedIds().size }} products.</p>
          <input type="number" min="0" max="90" [(ngModel)]="discountValue" class="admin-input mb-md" placeholder="e.g. 10" />
          <div class="flex gap-sm justify-end">
            <button type="button" class="admin-btn" (click)="discountDialogOpen.set(false)">Cancel</button>
            <button type="button" class="admin-btn-primary" (click)="runBulk('discount')">Apply</button>
          </div>
        </div>
      </div>
    }

    <!-- Category dialog -->
    @if (categoryDialogOpen()) {
      <div class="fixed inset-0 bg-ink/50 z-40 flex items-center justify-center p-lg" (click)="categoryDialogOpen.set(false)">
        <div class="admin-card p-lg max-w-sm w-full" (click)="$event.stopPropagation()">
          <h3 class="text-h4 mb-md">Move to category</h3>
          <p class="text-body-sm text-ink-muted mb-sm">Reassign {{ selectedIds().size }} products. Only leaf categories are allowed.</p>
          <select [(ngModel)]="targetCategoryId" class="admin-input mb-md">
            <option value="">— Select leaf category —</option>
            @for (c of leafCategoryOptions(); track c.id) {
              <option [value]="c.id">{{ c.indent }}{{ c.name }}</option>
            }
          </select>
          <div class="flex gap-sm justify-end">
            <button type="button" class="admin-btn" (click)="categoryDialogOpen.set(false)">Cancel</button>
            <button type="button" class="admin-btn-primary" (click)="runBulk('category')">Move</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ProductsListComponent {
  private readonly productsService = inject(ProductsService);
  private readonly categoriesService = inject(CategoriesService);

  search = '';
  categoryFilter = '';
  freshOnly = false;
  inactiveOnly = false;

  readonly items = signal<Product[]>([]);
  readonly total = signal(0);
  readonly selectedIds = signal(new Set<string>());
  readonly categories = toSignal(this.categoriesService.list(), { initialValue: [] as Category[] });

  // Dialogs
  readonly discountDialogOpen = signal(false);
  readonly categoryDialogOpen = signal(false);
  discountValue = 10;
  targetCategoryId = '';

  readonly bulkNote = signal<{ kind: 'ok' | 'err'; text: string } | null>(null);

  readonly visible = computed(() => {
    let out = this.items();
    if (this.freshOnly) out = out.filter((p) => p.isFresh);
    if (this.inactiveOnly) out = out.filter((p) => !p.isActive);
    return out;
  });

  readonly categoryOptions = computed(() => this.flattenCategories(this.categories()));
  readonly leafCategoryOptions = computed(() =>
    this.categoryOptions().filter((c) => (c._count?.children ?? 0) === 0),
  );

  readonly allVisibleSelected = computed(() => {
    const v = this.visible();
    if (v.length === 0) return false;
    const s = this.selectedIds();
    return v.every((p) => s.has(p.id));
  });

  constructor() {
    this.reload();
  }

  reload() {
    this.productsService.list({
      search: this.search || undefined,
      categoryId: this.categoryFilter || undefined,
      take: 200,
    }).subscribe((res) => {
      this.items.set(res.items);
      this.total.set(res.total);
    });
  }

  applyClientFilters() { /* triggers computed */ }

  toggleOne(id: string) {
    const s = new Set(this.selectedIds());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selectedIds.set(s);
  }

  toggleSelectAll(evt: Event) {
    const checked = (evt.target as HTMLInputElement).checked;
    const v = this.visible();
    const s = new Set(this.selectedIds());
    if (checked) v.forEach((p) => s.add(p.id));
    else v.forEach((p) => s.delete(p.id));
    this.selectedIds.set(s);
  }

  clearSelection() { this.selectedIds.set(new Set()); }

  openDiscountDialog() { this.discountValue = 10; this.discountDialogOpen.set(true); }
  openCategoryDialog() { this.targetCategoryId = ''; this.categoryDialogOpen.set(true); }

  runBulk(action: string) {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    let obs$;
    switch (action) {
      case 'discount':
        if (this.discountValue < 0 || this.discountValue > 90) return;
        obs$ = this.productsService.bulkSetDiscount(ids, this.discountValue);
        this.discountDialogOpen.set(false);
        break;
      case 'clear-discount':
        obs$ = this.productsService.bulkClearDiscount(ids); break;
      case 'fresh-on':
        obs$ = this.productsService.bulkSetFresh(ids, true); break;
      case 'fresh-off':
        obs$ = this.productsService.bulkSetFresh(ids, false); break;
      case 'activate':
        obs$ = this.productsService.bulkSetActive(ids, true); break;
      case 'deactivate':
        obs$ = this.productsService.bulkSetActive(ids, false); break;
      case 'category':
        if (!this.targetCategoryId) return;
        obs$ = this.productsService.bulkChangeCategory(ids, this.targetCategoryId);
        this.categoryDialogOpen.set(false);
        break;
      default: return;
    }
    obs$.subscribe({
      next: (res) => {
        this.bulkNote.set({ kind: 'ok', text: `Updated ${res.updated} product(s)` });
        this.clearSelection();
        this.reload();
        setTimeout(() => this.bulkNote.set(null), 3000);
      },
      error: (err) => this.bulkNote.set({ kind: 'err', text: err?.error?.message ?? 'Bulk action failed' }),
    });
  }

  private flattenCategories(cats: Category[]): Array<Category & { indent: string }> {
    const roots = cats.filter((c) => c.parentId === null);
    const out: Array<Category & { indent: string }> = [];
    for (const r of roots.sort((a, b) => a.sortOrder - b.sortOrder)) {
      out.push({ ...r, indent: '' });
      const kids = cats.filter((c) => c.parentId === r.id).sort((a, b) => a.sortOrder - b.sortOrder);
      for (const k of kids) out.push({ ...k, indent: '↳ ' });
    }
    return out;
  }
}
