import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CategoriesService } from '../../data/categories.service';
import { Category, CreateCategoryPayload } from '../../data/api.types';

@Component({
  selector: 'admin-category-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between mb-lg">
      <div>
        <a routerLink="/categories" class="text-caption uppercase tracking-wide text-ink-muted hover:text-accent">← Categories</a>
        <h1 class="text-h2 text-ink mt-xs">{{ isNew() ? 'New category' : 'Edit category' }}</h1>
        @if (!isNew() && current(); as c) {
          <p class="text-body-sm text-ink-muted">
            @if (c.parent) {
              Sub-category of <span class="text-ink font-medium">{{ c.parent.name }}</span>
            } @else if ((c._count?.children ?? 0) > 0) {
              Root with {{ c._count?.children }} sub-categorie(s)
            } @else {
              Root (leaf)
            }
          </p>
        }
      </div>
      @if (!isNew() && current()?.isActive) {
        <button type="button" class="admin-btn text-danger" (click)="remove()">Deactivate</button>
      }
    </div>

    <form [formGroup]="form" (ngSubmit)="submit()" class="grid grid-cols-1 lg:grid-cols-3 gap-lg">
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
              <input id="slug" class="admin-input font-mono" formControlName="slug" placeholder="kebab-case" />
            </div>
            <div>
              <label class="admin-label" for="sortOrder">Sort order</label>
              <input id="sortOrder" type="number" min="0" class="admin-input num-tabular" formControlName="sortOrder" />
            </div>
            <div class="col-span-2">
              <label class="admin-label" for="description">Description</label>
              <textarea id="description" class="admin-input" rows="2" formControlName="description"></textarea>
            </div>
            <div class="col-span-2">
              <label class="admin-label" for="heroImageUrl">Hero image URL</label>
              <input id="heroImageUrl" class="admin-input" formControlName="heroImageUrl" placeholder="https://…" />
            </div>
            <div class="flex items-center gap-md">
              <label class="flex items-center gap-xs text-body-sm">
                <input type="checkbox" formControlName="isActive" /> Active
              </label>
            </div>
          </div>
        </section>

        <section class="admin-card p-lg space-y-md">
          <h2 class="text-caption uppercase tracking-wide text-ink-muted">Hierarchy</h2>
          <div>
            <label class="admin-label" for="parentId">Parent category</label>
            <select id="parentId" class="admin-input" formControlName="parentId">
              <option value="">— None (create as a root category) —</option>
              @for (p of eligibleParents(); track p.id) {
                <option [value]="p.id">{{ p.name }} ({{ p.pricingMode }})</option>
              }
            </select>
            <p class="text-caption text-ink-subtle mt-xs">
              Only root categories are listed. Depth is capped at 2 levels.
              @if (form.get('parentId')?.value) {
                Sub-categories inherit their parent's pricing mode.
              }
            </p>
          </div>

          @if (!form.get('parentId')?.value) {
            <div>
              <label class="admin-label" for="pricingMode">Pricing mode <span class="text-danger">*</span></label>
              <select id="pricingMode" class="admin-input" formControlName="pricingMode">
                <option value="">— Select —</option>
                <option value="LIVE_METAL_RATE">LIVE_METAL_RATE (gold rate × weight)</option>
                <option value="FIXED_MRP">FIXED_MRP (per-product price)</option>
              </select>
              <p class="text-caption text-ink-subtle mt-xs">Required for root categories.</p>
            </div>
          }
        </section>
      </div>

      <div class="space-y-lg">
        <section class="admin-card p-lg space-y-sm">
          @if (error()) { <p class="text-body-sm text-danger">{{ error() }}</p> }
          <button type="submit" class="admin-btn-primary w-full" [disabled]="saving() || form.invalid">
            {{ saving() ? 'Saving…' : (isNew() ? 'Create category' : 'Save changes') }}
          </button>
          <a routerLink="/categories" class="admin-btn w-full text-center">Cancel</a>
        </section>

        @if (!isNew() && (current()?._count?.children ?? 0) > 0) {
          <section class="admin-card p-lg">
            <h3 class="text-caption uppercase tracking-wide text-ink-muted mb-sm">Sub-categories</h3>
            <ul class="text-body-sm space-y-xs">
              @for (sc of current()?.children ?? []; track sc.id) {
                <li>
                  <a [routerLink]="['/categories', sc.id]" class="text-ink hover:text-accent">
                    ↳ {{ sc.name }}
                    @if (!sc.isActive) { <span class="text-caption text-danger ml-xs">inactive</span> }
                  </a>
                </li>
              }
            </ul>
          </section>
        }
      </div>
    </form>
  `,
})
export class CategoryEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly categoriesService = inject(CategoriesService);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    description: [''],
    pricingMode: [''],
    parentId: [''],
    heroImageUrl: [''],
    sortOrder: [0],
    isActive: [true],
  });

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly current = signal<Category | null>(null);
  readonly all = signal<Category[]>([]);

  readonly categoryId = signal<string | null>(null);
  readonly isNew = computed(() => this.categoryId() === null);

  readonly eligibleParents = computed(() => {
    // Only roots (parentId===null) are eligible as parents. Exclude self if editing.
    const selfId = this.categoryId();
    return this.all().filter((c) => c.parentId === null && c.id !== selfId && c.isActive);
  });

  ngOnInit() {
    this.categoriesService.list().subscribe((cats) => this.all.set(cats));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.categoryId.set(id);
      this.categoriesService.byId(id).subscribe((c) => {
        this.current.set(c);
        this.form.patchValue({
          name: c.name,
          slug: c.slug,
          description: c.description ?? '',
          pricingMode: c.pricingMode,
          parentId: c.parentId ?? '',
          heroImageUrl: c.heroImageUrl ?? '',
          sortOrder: c.sortOrder,
          isActive: c.isActive,
        });

        // If this category already has children, its parentId cannot change to non-null.
        if ((c._count?.children ?? 0) > 0) {
          this.form.get('parentId')!.disable();
        }
      });
    }

    // When parentId is empty (root), pricingMode is required.
    this.form.get('parentId')!.valueChanges.subscribe((v) => {
      const modeCtrl = this.form.get('pricingMode')!;
      if (v) {
        modeCtrl.setValidators([]);
        modeCtrl.updateValueAndValidity();
      } else {
        modeCtrl.setValidators([Validators.required]);
        modeCtrl.updateValueAndValidity();
      }
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set(null);

    const raw = this.form.getRawValue();
    const payload: CreateCategoryPayload = {
      name: raw.name,
      slug: raw.slug,
      description: raw.description || undefined,
      parentId: raw.parentId || null,
      heroImageUrl: raw.heroImageUrl || undefined,
      sortOrder: Number(raw.sortOrder) || 0,
      isActive: raw.isActive,
    };
    if (!raw.parentId) {
      payload.pricingMode = (raw.pricingMode || undefined) as any;
    }

    const op$ = this.isNew()
      ? this.categoriesService.create(payload)
      : this.categoriesService.update(this.categoryId()!, payload);

    op$.subscribe({
      next: () => this.router.navigateByUrl('/categories'),
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message ?? 'Save failed');
      },
    });
  }

  remove() {
    if (!confirm('Deactivate this category?')) return;
    this.categoriesService.remove(this.categoryId()!).subscribe({
      next: () => this.router.navigateByUrl('/categories'),
      error: (err) => this.error.set(err?.error?.message ?? 'Delete failed'),
    });
  }
}
