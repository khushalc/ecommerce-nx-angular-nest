import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProductsService } from '../../data/products.service';
import { CategoriesService } from '../../data/categories.service';
import { CreateProductPayload, Metal, Purity } from '../../data/api.types';

@Component({
  selector: 'admin-product-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between mb-lg">
      <div>
        <a routerLink="/products" class="text-caption uppercase tracking-wide text-ink-muted hover:text-accent">← Products</a>
        <h1 class="text-h2 text-ink mt-xs">{{ isNew() ? 'New product' : 'Edit product' }}</h1>
      </div>
      @if (!isNew()) {
        <button type="button" class="admin-btn text-danger" (click)="remove()">Deactivate</button>
      }
    </div>

    <form [formGroup]="form" (ngSubmit)="submit()" class="grid grid-cols-1 lg:grid-cols-3 gap-lg">
      <!-- Left: primary fields -->
      <div class="lg:col-span-2 space-y-lg">
        <section class="admin-card p-lg space-y-md">
          <h2 class="text-caption uppercase tracking-wide text-ink-muted">Basics</h2>
          <div class="grid grid-cols-2 gap-md">
            <div class="col-span-2">
              <label class="admin-label" for="name">Name</label>
              <input id="name" class="admin-input" formControlName="name" />
            </div>
            <div>
              <label class="admin-label" for="slug">Slug</label>
              <input id="slug" class="admin-input" formControlName="slug" placeholder="kebab-case" />
            </div>
            <div>
              <label class="admin-label" for="sku">SKU</label>
              <input id="sku" class="admin-input font-mono" formControlName="sku" />
            </div>
            <div class="col-span-2">
              <label class="admin-label" for="description">Description</label>
              <textarea id="description" class="admin-input" rows="3" formControlName="description"></textarea>
            </div>
            <div>
              <label class="admin-label" for="categoryId">Category</label>
              <select id="categoryId" class="admin-input" formControlName="categoryId">
                <option value="">— Select —</option>
                @for (c of categories() ?? []; track c.id) {
                  <option [value]="c.id">{{ c.name }} ({{ c.pricingMode }})</option>
                }
              </select>
            </div>
            <div class="flex items-end gap-md">
              <label class="flex items-center gap-xs text-body-sm">
                <input type="checkbox" formControlName="isActive" /> Active
              </label>
              <label class="flex items-center gap-xs text-body-sm">
                <input type="checkbox" formControlName="isFresh" /> Fresh
              </label>
            </div>
          </div>
        </section>

        <!-- Pricing mode selector switches which fieldset applies -->
        <section class="admin-card p-lg space-y-md">
          <h2 class="text-caption uppercase tracking-wide text-ink-muted">Pricing</h2>
          <p class="text-body-sm text-ink-muted">
            Category is <b>{{ selectedCategory()?.pricingMode ?? '—' }}</b>. Fill the matching fields.
          </p>

          @if (selectedCategory()?.pricingMode === 'FIXED_MRP') {
            <div class="grid grid-cols-2 gap-md">
              <div>
                <label class="admin-label">MRP (₹)</label>
                <input type="number" class="admin-input num-tabular" formControlName="mrp" />
              </div>
              <div>
                <label class="admin-label">Special discount (%)</label>
                <input type="number" class="admin-input num-tabular" formControlName="specialDiscount" min="0" max="90" />
              </div>
            </div>
          } @else if (selectedCategory()?.pricingMode === 'LIVE_METAL_RATE') {
            <div class="grid grid-cols-2 md:grid-cols-4 gap-md">
              <div>
                <label class="admin-label">Metal</label>
                <select class="admin-input" formControlName="metal">
                  <option value="">—</option>
                  @for (m of metals; track m) { <option [value]="m">{{ m }}</option> }
                </select>
              </div>
              <div>
                <label class="admin-label">Purity</label>
                <select class="admin-input" formControlName="purity">
                  <option value="">—</option>
                  @for (p of purities; track p) { <option [value]="p">{{ p }}</option> }
                </select>
              </div>
              <div>
                <label class="admin-label">Weight (g)</label>
                <input type="number" step="0.001" class="admin-input num-tabular" formControlName="weightGrams" />
              </div>
              <div>
                <label class="admin-label">Making %</label>
                <input type="number" step="0.01" class="admin-input num-tabular" formControlName="makingPct" />
              </div>
              <div>
                <label class="admin-label">Stone value (₹)</label>
                <input type="number" step="0.01" class="admin-input num-tabular" formControlName="stoneValue" />
              </div>
              <div>
                <label class="admin-label">Special discount (%)</label>
                <input type="number" class="admin-input num-tabular" formControlName="specialDiscount" min="0" max="90" />
              </div>
            </div>
          }
        </section>

        <section class="admin-card p-lg space-y-md">
          <h2 class="text-caption uppercase tracking-wide text-ink-muted">Inventory</h2>
          <div class="grid grid-cols-3 gap-md">
            <div>
              <label class="admin-label">Stock</label>
              <input type="number" min="0" class="admin-input num-tabular" formControlName="stock" />
            </div>
            <div>
              <label class="admin-label">Low-stock threshold</label>
              <input type="number" min="0" class="admin-input num-tabular" formControlName="lowStockThreshold" />
            </div>
            <div class="flex items-end">
              <label class="flex items-center gap-xs text-body-sm">
                <input type="checkbox" formControlName="allowBackorder" /> Allow backorder
              </label>
            </div>
          </div>
        </section>
      </div>

      <!-- Right: images + actions -->
      <div class="space-y-lg">
        <section class="admin-card p-lg space-y-md">
          <h2 class="text-caption uppercase tracking-wide text-ink-muted">Images</h2>

          <div class="space-y-sm">
            @for (url of imageUrls(); track $index) {
              <div class="flex items-center gap-sm">
                <img [src]="url" alt="" class="w-10 h-12 object-cover" />
                <span class="text-caption text-ink-muted flex-1 truncate">{{ url }}</span>
                <button type="button" class="admin-btn text-danger" (click)="removeImage($index)">×</button>
              </div>
            }
          </div>

          <input type="file" accept="image/*" (change)="onFile($event)" class="text-body-sm" />
          @if (uploading()) { <p class="text-caption text-ink-muted">Uploading…</p> }
          @if (uploadNote()) { <p class="text-caption text-info">{{ uploadNote() }}</p> }
        </section>

        <section class="admin-card p-lg space-y-sm">
          @if (error()) { <p class="text-body-sm text-danger">{{ error() }}</p> }
          <button type="submit" class="admin-btn-primary w-full" [disabled]="saving() || form.invalid">
            {{ saving() ? 'Saving…' : (isNew() ? 'Create product' : 'Save changes') }}
          </button>
          <a routerLink="/products" class="admin-btn w-full text-center">Cancel</a>
        </section>
      </div>
    </form>
  `,
})
export class ProductEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly categoriesService = inject(CategoriesService);

  readonly metals: Metal[] = ['GOLD', 'SILVER', 'PLATINUM'];
  readonly purities: Purity[] = ['K14', 'K18', 'K22', 'K24'];

  readonly categories = toSignal(this.categoriesService.list());

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    sku: ['', Validators.required],
    description: [''],
    categoryId: ['', Validators.required],
    isActive: [true],
    isFresh: [false],
    specialDiscount: [0],
    stock: [0],
    lowStockThreshold: [3],
    allowBackorder: [false],
    mrp: [null as number | null],
    metal: [null as Metal | null],
    purity: [null as Purity | null],
    weightGrams: [null as number | null],
    makingPct: [null as number | null],
    stoneValue: [null as number | null],
  });

  readonly imageUrls = signal<string[]>([]);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly uploadNote = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  readonly productId = signal<string | null>(null);
  readonly isNew = computed(() => this.productId() === null);

  readonly selectedCategoryId = signal<string>('');
  readonly selectedCategory = computed(() => this.categories()?.find(c => c.id === this.selectedCategoryId()));

  ngOnInit() {
    this.form.get('categoryId')!.valueChanges.subscribe(v => this.selectedCategoryId.set(v));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productId.set(id);
      this.productsService.byId(id).subscribe((p) => {
        this.form.patchValue({
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          description: p.description ?? '',
          categoryId: p.category.id,
          isActive: p.isActive,
          isFresh: p.isFresh,
          specialDiscount: p.specialDiscount ?? 0,
          stock: 0,     // stock returned via stockDisplay.qty; keep as-is unless changed
          lowStockThreshold: 3,
          allowBackorder: false,
          mrp: p.mrp,
          metal: p.metal,
          purity: p.purity,
          weightGrams: p.weightGrams,
          makingPct: p.makingPct,
          stoneValue: null,
        });
        this.form.get('stock')!.setValue(p.stockDisplay.qty);
        this.imageUrls.set(p.images);
        this.selectedCategoryId.set(p.category.id);
      });
    }
  }

  onFile(evt: Event) {
    const file = (evt.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.uploadNote.set(null);

    this.productsService.presignUpload(file.name, file.type).subscribe({
      next: (res) => {
        // Phase 1 stub: we don't actually PUT to the pre-signed URL — just take the publicUrl
        // and pretend the file is stored. Phase 4 will do a real fetch(PUT, uploadUrl, file).
        this.imageUrls.update((arr) => [...arr, res.publicUrl]);
        this.uploading.set(false);
        this.uploadNote.set('Stubbed: URL added. Phase 4 will do a real S3 PUT.');
      },
      error: (err) => {
        this.uploading.set(false);
        this.uploadNote.set(`Upload failed: ${err?.error?.message ?? err.message}`);
      },
    });
  }

  removeImage(idx: number) {
    this.imageUrls.update((arr) => arr.filter((_, i) => i !== idx));
  }

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set(null);

    const raw = this.form.getRawValue();
    const payload = this.buildPayload(raw);

    const op$ = this.isNew()
      ? this.productsService.create(payload)
      : this.productsService.update(this.productId()!, payload);

    op$.subscribe({
      next: () => this.router.navigateByUrl('/products'),
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message ?? 'Save failed');
      },
    });
  }

  remove() {
    if (!confirm('Deactivate this product? (Soft delete)')) return;
    this.productsService.remove(this.productId()!).subscribe({
      next: () => this.router.navigateByUrl('/products'),
      error: (err) => this.error.set(err?.error?.message ?? 'Delete failed'),
    });
  }

  private buildPayload(v: any): CreateProductPayload {
    const payload: CreateProductPayload = {
      name: v.name,
      slug: v.slug,
      sku: v.sku,
      description: v.description || undefined,
      categoryId: v.categoryId,
      images: this.imageUrls(),
      isActive: v.isActive,
      isFresh: v.isFresh,
      specialDiscount: v.specialDiscount ?? 0,
      stock: v.stock ?? 0,
      lowStockThreshold: v.lowStockThreshold ?? 3,
      allowBackorder: v.allowBackorder,
    };

    const mode = this.selectedCategory()?.pricingMode;
    if (mode === 'FIXED_MRP') {
      payload.mrp = Number(v.mrp);
    } else if (mode === 'LIVE_METAL_RATE') {
      payload.metal = v.metal || undefined;
      payload.purity = v.purity || undefined;
      payload.weightGrams = v.weightGrams != null ? Number(v.weightGrams) : undefined;
      payload.makingPct = v.makingPct != null ? Number(v.makingPct) : undefined;
      payload.stoneValue = v.stoneValue != null ? Number(v.stoneValue) : undefined;
    }
    return payload;
  }
}
