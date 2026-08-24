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
        <div class="aspect-[16/6] md:aspect-[16/5] bg-bg-muted overflow-hidden relative">
          @if (c.heroImageUrl) {
            <img [src]="c.heroImageUrl" [alt]="c.name" class="w-full h-full object-cover" />
          }
          <!-- Contrast gradient so title stays readable on any hero image -->
          <div class="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent" aria-hidden="true"></div>
        </div>
        <div class="absolute inset-0 flex items-end">
          <div class="container-page pb-xl">
            <nav class="text-caption uppercase tracking-wide text-bg-muted mb-sm" aria-label="Breadcrumb">
              <a routerLink="/" class="hover:text-gold-soft">Home</a>
              @if (c.parent) {
                <span class="mx-xs">/</span>
                <a [routerLink]="'/c/' + c.parent.slug" class="hover:text-gold-soft">{{ c.parent.name }}</a>
              }
              <span class="mx-xs">/</span>
              <span class="text-gold-soft">{{ c.name }}</span>
            </nav>
            <h1 class="text-h1 md:text-display text-bg">{{ c.name }}</h1>
          </div>
        </div>
      </section>

      <!-- Meta -->
      <section class="container-page py-lg">
        @if (c.description) {
          <p class="text-body-lg text-ink-muted max-w-3xl">{{ c.description }}</p>
        }
        <p class="text-caption uppercase tracking-wide text-ink-subtle mt-sm">
          @if (c.isLeaf) {
            {{ c.products.length }} pieces
          } @else {
            {{ c.children.length }} {{ c.children.length === 1 ? 'sub-category' : 'sub-categories' }}
          }
          · {{ c.pricingMode === 'LIVE_METAL_RATE' ? 'Live metal rate' : 'Fixed price' }}
        </p>
      </section>

      <!-- Sub-category chips (only when this category has children) -->
      @if (c.children.length > 0) {
        <section class="container-page pb-lg">
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-lg">
            @for (sc of c.children; track sc.slug) {
              <a [routerLink]="'/c/' + sc.slug" class="group block">
                <div class="aspect-[4/3] bg-bg-muted overflow-hidden">
                  @if (sc.heroImageUrl) {
                    <img [src]="sc.heroImageUrl" [alt]="sc.name" class="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
                  }
                </div>
                <div class="mt-sm">
                  <h3 class="text-h4 text-ink group-hover:text-gold transition">{{ sc.name }}</h3>
                  @if (sc.description) {
                    <p class="text-caption text-ink-muted line-clamp-1">{{ sc.description }}</p>
                  }
                </div>
              </a>
            }
          </div>
        </section>
      }

      <!-- Product grid (only on leaf categories) -->
      @if (c.isLeaf) {
        <section class="container-page pb-2xl">
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-lg">
            @for (p of c.products; track p.slug) {
              <sf-product-card [product]="p" />
            } @empty {
              <p class="col-span-full text-body text-ink-muted py-2xl text-center">No products in this category yet.</p>
            }
          </div>
        </section>
      }
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
