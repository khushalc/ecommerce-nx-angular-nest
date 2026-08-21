import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap, tap } from 'rxjs';

import { CategoriesService } from '../../data/categories.service';
import { SeoService } from '../../seo/seo.service';
import { ProductCardComponent } from '../../shared/product-card.component';

@Component({
  selector: 'sf-category',
  standalone: true,
  imports: [RouterLink, ProductCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let c = category();
    @if (c) {
      <!-- Hero -->
      <section class="relative">
        <div class="aspect-[16/6] md:aspect-[16/5] bg-bg-muted overflow-hidden">
          @if (c.heroImageUrl) {
            <img [src]="c.heroImageUrl" [alt]="c.name" class="w-full h-full object-cover" />
          }
        </div>
        <div class="absolute inset-0 flex items-end">
          <div class="container-page pb-lg">
            <nav class="text-caption uppercase tracking-wide text-bg mb-sm" aria-label="Breadcrumb">
              <a routerLink="/" class="hover:text-gold-soft">Home</a>
              <span class="mx-xs">/</span>
              <span class="text-gold-soft">{{ c.name }}</span>
            </nav>
            <h1 class="text-h1 md:text-display text-bg drop-shadow-lg">{{ c.name }}</h1>
          </div>
        </div>
      </section>

      <!-- Meta -->
      <section class="container-page py-lg">
        @if (c.description) {
          <p class="text-body-lg text-ink-muted max-w-3xl">{{ c.description }}</p>
        }
        <p class="text-caption uppercase tracking-wide text-ink-subtle mt-sm">
          {{ c.products.length }} pieces · {{ c.pricingMode === 'LIVE_METAL_RATE' ? 'Live metal rate' : 'Fixed price' }}
        </p>
      </section>

      <!-- Grid -->
      <section class="container-page pb-2xl">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-lg">
          @for (p of c.products; track p.slug) {
            <sf-product-card [product]="p" />
          } @empty {
            <p class="col-span-full text-body text-ink-muted py-2xl text-center">No products in this category yet.</p>
          }
        </div>
      </section>
    } @else if (loading()) {
      <div class="container-page py-4xl text-center text-ink-muted">Loading…</div>
    } @else {
      <div class="container-page py-4xl text-center">
        <h1 class="text-h2 text-ink mb-sm">Category not found</h1>
        <a routerLink="/" class="btn-ghost mt-md">Back home</a>
      </div>
    }
  `,
})
export class CategoryComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly categoriesService = inject(CategoriesService);
  private readonly seo = inject(SeoService);

  readonly category = toSignal(
    this.route.params.pipe(
      switchMap(({ slug }) =>
        this.categoriesService.bySlug(slug).pipe(
          tap((cat) =>
            this.seo.applyBasic({
              title: cat.name,
              description: cat.description ?? `${cat.name} — Certified fine jewelry.`,
              canonicalPath: `/c/${cat.slug}`,
              ogImage: cat.heroImageUrl ?? undefined,
            }),
          ),
        ),
      ),
    ),
  );

  readonly loading = computed(() => this.category() === undefined);
}
