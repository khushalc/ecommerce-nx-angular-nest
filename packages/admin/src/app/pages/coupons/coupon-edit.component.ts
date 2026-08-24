import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CouponsService } from '../../data/coupons.service';
import { Coupon, CouponType, CreateCouponPayload } from '../../data/api.types';

@Component({
  selector: 'admin-coupon-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between mb-lg">
      <div>
        <a routerLink="/coupons" class="text-caption uppercase tracking-wide text-ink-muted hover:text-accent">← Coupons</a>
        <h1 class="text-h2 text-ink mt-xs">{{ isNew() ? 'New coupon' : 'Edit coupon' }}</h1>
      </div>
      @if (!isNew() && current()?.isActive) {
        <button type="button" class="admin-btn text-danger" (click)="remove()">Deactivate</button>
      }
    </div>

    <form [formGroup]="form" (ngSubmit)="submit()" class="grid grid-cols-1 lg:grid-cols-3 gap-lg">
      <section class="admin-card p-lg space-y-md lg:col-span-2">
        <h2 class="text-caption uppercase tracking-wide text-ink-muted">Basics</h2>
        <div class="grid grid-cols-2 gap-md">
          <div>
            <label class="admin-label">Code</label>
            <input class="admin-input font-mono uppercase" formControlName="code" placeholder="DIWALI20" />
          </div>
          <div>
            <label class="admin-label">Type</label>
            <select class="admin-input" formControlName="discountType">
              <option value="PERCENT">PERCENT (%)</option>
              <option value="FLAT">FLAT (₹)</option>
            </select>
          </div>
          <div>
            <label class="admin-label">Value ({{ form.get('discountType')?.value === 'PERCENT' ? '%' : '₹' }})</label>
            <input type="number" min="0" class="admin-input num-tabular" formControlName="discountValue" />
          </div>
          <div>
            <label class="admin-label">Max discount (₹)</label>
            <input type="number" min="0" class="admin-input num-tabular" formControlName="maxDiscount" placeholder="cap on final discount" />
          </div>
          <div>
            <label class="admin-label">Min cart value (₹)</label>
            <input type="number" min="0" class="admin-input num-tabular" formControlName="minCartValue" placeholder="e.g. 5000" />
          </div>
          <div>
            <label class="admin-label">Total usage cap</label>
            <input type="number" min="1" class="admin-input num-tabular" formControlName="totalUsageCap" placeholder="unlimited if empty" />
          </div>
          <div class="col-span-2">
            <label class="admin-label">Description</label>
            <textarea class="admin-input" rows="2" formControlName="description" placeholder="Shown in admin summaries"></textarea>
          </div>
        </div>
      </section>

      <section class="admin-card p-lg space-y-md">
        <h2 class="text-caption uppercase tracking-wide text-ink-muted">Window &amp; state</h2>
        <div>
          <label class="admin-label">Starts at</label>
          <input type="datetime-local" class="admin-input num-tabular" formControlName="startsAt" />
        </div>
        <div>
          <label class="admin-label">Ends at</label>
          <input type="datetime-local" class="admin-input num-tabular" formControlName="endsAt" />
        </div>
        <label class="flex items-center gap-xs text-body-sm">
          <input type="checkbox" formControlName="isActive" /> Active
        </label>

        @if (error()) { <p class="text-body-sm text-danger">{{ error() }}</p> }
        <button type="submit" class="admin-btn-primary w-full" [disabled]="saving() || form.invalid">
          {{ saving() ? 'Saving…' : (isNew() ? 'Create coupon' : 'Save changes') }}
        </button>

        @if (!isNew() && current(); as c) {
          <div class="text-caption text-ink-muted mt-sm">
            Used {{ c.totalUsageCount }} time{{ c.totalUsageCount === 1 ? '' : 's' }}
            @if (c.totalUsageCap) { of {{ c.totalUsageCap }} }
          </div>
        }
      </section>
    </form>
  `,
})
export class CouponEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly couponsService = inject(CouponsService);

  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9_-]{3,32}$/)]],
    description: [''],
    discountType: ['PERCENT' as CouponType, Validators.required],
    discountValue: [10, [Validators.required, Validators.min(0)]],
    minCartValue: [null as number | null],
    maxDiscount: [null as number | null],
    totalUsageCap: [null as number | null],
    startsAt: [''],
    endsAt: [''],
    isActive: [true],
  });

  readonly current = signal<Coupon | null>(null);
  readonly couponId = signal<string | null>(null);
  readonly isNew = computed(() => this.couponId() === null);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.couponId.set(id);
      this.couponsService.byId(id).subscribe((c) => {
        this.current.set(c);
        this.form.patchValue({
          code: c.code,
          description: c.description ?? '',
          discountType: c.discountType,
          discountValue: +c.discountValue,
          minCartValue: c.minCartValue != null ? +c.minCartValue : null,
          maxDiscount: c.maxDiscount != null ? +c.maxDiscount : null,
          totalUsageCap: c.totalUsageCap,
          startsAt: c.startsAt ? this.toLocalDatetime(c.startsAt) : '',
          endsAt: c.endsAt ? this.toLocalDatetime(c.endsAt) : '',
          isActive: c.isActive,
        });
      });
    }
  }

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set(null);

    const raw = this.form.getRawValue();
    const payload: CreateCouponPayload = {
      code: raw.code.toUpperCase(),
      description: raw.description || undefined,
      discountType: raw.discountType,
      discountValue: Number(raw.discountValue),
      minCartValue: raw.minCartValue == null ? undefined : Number(raw.minCartValue),
      maxDiscount: raw.maxDiscount == null ? undefined : Number(raw.maxDiscount),
      totalUsageCap: raw.totalUsageCap == null ? undefined : Number(raw.totalUsageCap),
      startsAt: raw.startsAt ? new Date(raw.startsAt).toISOString() : undefined,
      endsAt: raw.endsAt ? new Date(raw.endsAt).toISOString() : undefined,
      isActive: raw.isActive,
    };

    const op$ = this.isNew()
      ? this.couponsService.create(payload)
      : this.couponsService.update(this.couponId()!, payload);

    op$.subscribe({
      next: () => this.router.navigateByUrl('/coupons'),
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message ?? 'Save failed');
      },
    });
  }

  remove() {
    if (!confirm('Deactivate this coupon?')) return;
    this.couponsService.remove(this.couponId()!).subscribe(() => this.router.navigateByUrl('/coupons'));
  }

  private toLocalDatetime(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
