import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { SalesService } from '../../data/sales.service';
import { ProductsService } from '../../data/products.service';
import { CategoriesService } from '../../data/categories.service';
import { Category, CreateSalePayload, Product, Sale, SaleTargetInput } from '../../data/api.types';

interface RowState {
  product: Product;
  selected: boolean;
  overridePct: number | null;
}

@Component({
  selector: 'admin-sale-edit',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between mb-lg">
      <div>
        <a routerLink="/sales" class="text-caption uppercase tracking-wide text-ink-muted hover:text-accent">← Events</a>
        <h1 class="text-h2 text-ink mt-xs">{{ isNew() ? 'New event' : 'Edit event' }}</h1>
      </div>
      @if (!isNew() && current()?.isActive) {
        <button type="button" class="admin-btn text-danger" (click)="remove()">Deactivate</button>
      }
    </div>

    <form [formGroup]="form" (ngSubmit)="saveMeta()" class="grid grid-cols-1 lg:grid-cols-3 gap-lg mb-lg">
      <section class="admin-card p-lg space-y-md lg:col-span-2">
        <h2 class="text-caption uppercase tracking-wide text-ink-muted">Event details</h2>
        <div class="grid grid-cols-2 gap-md">
          <div class="col-span-2">
            <label class="admin-label">Name</label>
            <input class="admin-input" formControlName="name" placeholder="Diwali Sale 2026" />
          </div>
          <div>
            <label class="admin-label">Slug</label>
            <input class="admin-input font-mono" formControlName="slug" placeholder="diwali-2026" />
          </div>
          <div>
            <label class="admin-label">Default discount (%)</label>
            <input type="number" min="0" max="90" class="admin-input num-tabular" formControlName="defaultDiscountPct" />
          </div>
          <div>
            <label class="admin-label">Starts at</label>
            <input type="datetime-local" class="admin-input num-tabular" formControlName="startsAt" />
          </div>
          <div>
            <label class="admin-label">Ends at</label>
            <input type="datetime-local" class="admin-input num-tabular" formControlName="endsAt" />
          </div>
          <div class="col-span-2">
            <label class="admin-label">Description</label>
            <textarea class="admin-input" rows="2" formControlName="description"></textarea>
          </div>
          <div>
            <label class="admin-label">Max discount per cart (₹)</label>
            <input type="number" min="0" class="admin-input num-tabular" formControlName="maxDiscountPerCart" placeholder="Optional cap" />
          </div>
          <div class="flex items-end gap-md">
            <label class="flex items-center gap-xs text-body-sm">
              <input type="checkbox" formControlName="isActive" /> Active
            </label>
            <label class="flex items-center gap-xs text-body-sm">
              <input type="checkbox" formControlName="showInBanner" /> Show in banner
            </label>
          </div>
        </div>
      </section>

      <section class="admin-card p-lg space-y-md">
        <h2 class="text-caption uppercase tracking-wide text-ink-muted">Banner content</h2>
        <div>
          <label class="admin-label">Banner label</label>
          <input class="admin-input" formControlName="bannerLabel" placeholder="Diwali Sale — up to 80% off select pieces" />
        </div>
        <div>
          <label class="admin-label">Banner image URL</label>
          <input class="admin-input" formControlName="bannerImageUrl" placeholder="https://…" />
        </div>
        <div>
          <label class="admin-label">CTA label</label>
          <input class="admin-input" formControlName="ctaLabel" placeholder="Shop the sale" />
        </div>
        <div>
          <label class="admin-label">CTA href</label>
          <input class="admin-input font-mono" formControlName="ctaHref" placeholder="/c/gold-rings" />
        </div>

        @if (metaError()) { <p class="text-body-sm text-danger">{{ metaError() }}</p> }
        <button type="submit" class="admin-btn-primary w-full" [disabled]="metaSaving() || form.invalid">
          {{ metaSaving() ? 'Saving…' : (isNew() ? 'Create event' : 'Save event') }}
        </button>
      </section>
    </form>

    <!-- Product picker (only meaningful after the sale exists) -->
    @if (!isNew()) {
      <section class="admin-card p-lg">
        <div class="flex flex-wrap items-center justify-between gap-md mb-md">
          <div>
            <h2 class="text-h4 text-ink">Products in this event</h2>
            <p class="text-body-sm text-ink-muted">
              {{ selectedCount() }} selected · default {{ form.get('defaultDiscountPct')?.value || 0 }}% applies unless overridden per row
            </p>
          </div>
          <button type="button" class="admin-btn-primary" (click)="saveTargets()" [disabled]="targetsSaving()">
            {{ targetsSaving() ? 'Saving…' : 'Save selection' }}
          </button>
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap items-end gap-md mb-md">
          <div class="flex-1 min-w-64">
            <label class="admin-label">Search</label>
            <input type="search" [(ngModel)]="productSearch" (ngModelChange)="reloadProducts()" class="admin-input" placeholder="Name / SKU / slug…" />
          </div>
          <div>
            <label class="admin-label">Category</label>
            <select [(ngModel)]="productCategoryFilter" (ngModelChange)="reloadProducts()" class="admin-input">
              <option value="">All categories</option>
              @for (c of categoryOptions(); track c.id) {
                <option [value]="c.id">{{ c.indent }}{{ c.name }}</option>
              }
            </select>
          </div>
          <label class="flex items-center gap-xs text-body-sm">
            <input type="checkbox" [(ngModel)]="onlySelected" /> Selected only
          </label>
        </div>

        @if (targetsNote(); as n) {
          <p class="mb-md text-body-sm" [class.text-success]="n.kind === 'ok'" [class.text-danger]="n.kind === 'err'">{{ n.text }}</p>
        }

        <table class="admin-table">
          <thead>
            <tr>
              <th class="w-10">
                <input type="checkbox" [checked]="allSelected()" (change)="toggleAll($event)" />
              </th>
              <th>Product</th>
              <th>Category</th>
              <th class="text-right">List price</th>
              <th class="text-right">Override %</th>
            </tr>
          </thead>
          <tbody>
            @for (row of visibleRows(); track row.product.id) {
              <tr>
                <td>
                  <input type="checkbox" [checked]="row.selected" (change)="toggleRow(row.product.id)" />
                </td>
                <td>
                  <div class="text-ink font-medium">{{ row.product.name }}</div>
                  <div class="text-caption text-ink-subtle font-mono">{{ row.product.sku }}</div>
                </td>
                <td>{{ row.product.category.name }}</td>
                <td class="text-right num-tabular">₹ {{ row.product.price.listPrice.toLocaleString('en-IN') }}</td>
                <td class="text-right">
                  <input
                    type="number"
                    min="0" max="90"
                    class="admin-input num-tabular w-20 text-right ml-auto"
                    [ngModel]="row.overridePct"
                    (ngModelChange)="updateOverride(row.product.id, $event)"
                    [disabled]="!row.selected"
                    placeholder="default" />
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="text-center text-ink-muted py-xl">No products match.</td></tr>
            }
          </tbody>
        </table>
      </section>
    }
  `,
})
export class SaleEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly salesService = inject(SalesService);
  private readonly productsService = inject(ProductsService);
  private readonly categoriesService = inject(CategoriesService);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    description: [''],
    startsAt: ['', Validators.required],
    endsAt: ['', Validators.required],
    isActive: [true],
    showInBanner: [true],
    bannerLabel: [''],
    bannerImageUrl: [''],
    ctaLabel: [''],
    ctaHref: [''],
    defaultDiscountPct: [0],
    maxDiscountPerCart: [null as number | null],
  });

  readonly current = signal<Sale | null>(null);
  readonly saleId = signal<string | null>(null);
  readonly isNew = computed(() => this.saleId() === null);

  readonly metaSaving = signal(false);
  readonly metaError = signal<string | null>(null);
  readonly targetsSaving = signal(false);
  readonly targetsNote = signal<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Product picker state
  readonly allProducts = signal<Product[]>([]);
  readonly selectedMap = signal(new Map<string, { override: number | null }>());
  productSearch = '';
  productCategoryFilter = '';
  onlySelected = false;

  readonly categories = toSignal(this.categoriesService.list(), { initialValue: [] as Category[] });
  readonly categoryOptions = computed(() => this.flattenCategories(this.categories()));

  readonly rows = computed<RowState[]>(() => {
    const sel = this.selectedMap();
    return this.allProducts().map((p) => ({
      product: p,
      selected: sel.has(p.id),
      overridePct: sel.get(p.id)?.override ?? null,
    }));
  });

  readonly visibleRows = computed(() => {
    let rs = this.rows();
    if (this.onlySelected) rs = rs.filter((r) => r.selected);
    return rs;
  });

  readonly selectedCount = computed(() => this.selectedMap().size);
  readonly allSelected = computed(() => {
    const vis = this.visibleRows();
    return vis.length > 0 && vis.every((r) => r.selected);
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.saleId.set(id);
      this.salesService.byId(id).subscribe((s) => this.hydrate(s));
      this.reloadProducts();
    }
  }

  private hydrate(s: Sale) {
    this.current.set(s);
    this.form.patchValue({
      name: s.name,
      slug: s.slug,
      description: s.description ?? '',
      startsAt: this.toLocalDatetime(s.startsAt),
      endsAt: this.toLocalDatetime(s.endsAt),
      isActive: s.isActive,
      showInBanner: s.showInBanner,
      bannerLabel: s.bannerLabel ?? '',
      bannerImageUrl: s.bannerImageUrl ?? '',
      ctaLabel: s.ctaLabel ?? '',
      ctaHref: s.ctaHref ?? '',
      defaultDiscountPct: s.defaultDiscountPct ?? 0,
      maxDiscountPerCart: s.maxDiscountPerCart,
    });

    // Seed selection from existing targets
    const m = new Map<string, { override: number | null }>();
    for (const t of s.targets ?? []) {
      m.set(t.productId, { override: t.discountPctOverride });
    }
    this.selectedMap.set(m);
  }

  reloadProducts() {
    this.productsService.list({
      search: this.productSearch || undefined,
      categoryId: this.productCategoryFilter || undefined,
      take: 200,
    }).subscribe((res) => this.allProducts.set(res.items));
  }

  toggleRow(pid: string) {
    const m = new Map(this.selectedMap());
    if (m.has(pid)) m.delete(pid);
    else m.set(pid, { override: null });
    this.selectedMap.set(m);
  }

  toggleAll(evt: Event) {
    const checked = (evt.target as HTMLInputElement).checked;
    const m = new Map(this.selectedMap());
    for (const r of this.visibleRows()) {
      if (checked) { if (!m.has(r.product.id)) m.set(r.product.id, { override: null }); }
      else m.delete(r.product.id);
    }
    this.selectedMap.set(m);
  }

  updateOverride(pid: string, v: number | null) {
    const m = new Map(this.selectedMap());
    if (!m.has(pid)) return;
    const n = (v == null || (typeof v === 'string' && v === '')) ? null : Number(v);
    m.set(pid, { override: n });
    this.selectedMap.set(m);
  }

  saveMeta() {
    if (this.form.invalid) return;
    this.metaSaving.set(true);
    this.metaError.set(null);

    const raw = this.form.getRawValue();
    const payload: CreateSalePayload = {
      name: raw.name,
      slug: raw.slug,
      description: raw.description || undefined,
      startsAt: new Date(raw.startsAt).toISOString(),
      endsAt: new Date(raw.endsAt).toISOString(),
      isActive: raw.isActive,
      showInBanner: raw.showInBanner,
      bannerLabel: raw.bannerLabel || undefined,
      bannerImageUrl: raw.bannerImageUrl || undefined,
      ctaLabel: raw.ctaLabel || undefined,
      ctaHref: raw.ctaHref || undefined,
      defaultDiscountPct: raw.defaultDiscountPct ?? undefined,
      maxDiscountPerCart: raw.maxDiscountPerCart ?? undefined,
    };

    const op$ = this.isNew()
      ? this.salesService.create(payload)
      : this.salesService.update(this.saleId()!, payload);

    op$.subscribe({
      next: (s) => {
        this.metaSaving.set(false);
        if (this.isNew()) {
          this.router.navigateByUrl(`/sales/${s.id}`);
        } else {
          this.hydrate(s);
        }
      },
      error: (err) => {
        this.metaSaving.set(false);
        this.metaError.set(err?.error?.message ?? 'Save failed');
      },
    });
  }

  saveTargets() {
    if (this.isNew()) return;
    this.targetsSaving.set(true);
    this.targetsNote.set(null);
    const targets: SaleTargetInput[] = [];
    for (const [productId, v] of this.selectedMap()) {
      targets.push({ productId, discountPctOverride: v.override });
    }
    this.salesService.setTargets(this.saleId()!, targets).subscribe({
      next: () => {
        this.targetsSaving.set(false);
        this.targetsNote.set({ kind: 'ok', text: `${targets.length} products saved to this event` });
        setTimeout(() => this.targetsNote.set(null), 3000);
      },
      error: (err) => {
        this.targetsSaving.set(false);
        this.targetsNote.set({ kind: 'err', text: err?.error?.message ?? 'Save failed' });
      },
    });
  }

  remove() {
    if (!confirm('Deactivate this event? It will no longer show in the banner and its discounts will stop.')) return;
    this.salesService.remove(this.saleId()!).subscribe(() => this.router.navigateByUrl('/sales'));
  }

  private toLocalDatetime(iso: string): string {
    const d = new Date(iso);
    // Format YYYY-MM-DDTHH:mm for <input type="datetime-local">
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
