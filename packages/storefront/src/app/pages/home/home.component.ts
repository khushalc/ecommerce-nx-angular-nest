import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { CategoriesService } from '../../data/categories.service';
import { ProductsService } from '../../data/products.service';
import { SeoService } from '../../seo/seo.service';
import { ProductCardComponent } from '../../shared/product-card.component';

@Component({
  selector: 'sf-home',
  standalone: true,
  imports: [RouterLink, ProductCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Hero -->
    <section class="bg-bg-muted">
      <div class="container-page py-3xl md:py-4xl grid md:grid-cols-2 gap-xl items-center">
        <div>
          <p class="text-caption uppercase tracking-widest text-gold mb-md">Autumn Collection · 2026</p>
          <h1 class="text-h1 md:text-display text-ink mb-md leading-tight">
            Heirloom pieces,<br />crafted for today.
          </h1>
          <p class="text-body-lg text-ink-muted mb-lg max-w-lg">
            Certified 22K &amp; 24K gold, ethically-sourced diamonds, and hand-finished silver
            — priced at today's live metal rate.
          </p>
          <div class="flex flex-wrap gap-md">
            <a routerLink="/c/gold-rings" class="btn-primary">Shop rings</a>
            <a routerLink="/c/diamond-jewelry" class="btn-ghost">Shop diamonds</a>
          </div>
        </div>
        <div class="aspect-[4/5] bg-bg-elevated relative overflow-hidden border border-line">
          <img
            src="https://placehold.co/1000x1250/F1EADD/1F1B16?text=Autumn%0ACollection&font=playfair-display"
            alt="Autumn Collection featured jewelry"
            class="w-full h-full object-cover" />
        </div>
      </div>
    </section>

    <!-- Categories -->
    <section class="container-page py-2xl">
      <div class="flex items-baseline justify-between mb-xl">
        <h2 class="text-h2 text-ink">Shop by category</h2>
        <a routerLink="/c/gold-rings" class="text-caption uppercase tracking-wide text-gold hover:text-gold-hover">All →</a>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-lg">
        @for (c of categories(); track c.slug) {
          <a [routerLink]="'/c/' + c.slug" class="group block">
            <div class="aspect-[4/5] bg-bg-muted overflow-hidden relative flex items-end p-lg
                        border border-line group-hover:border-gold-soft transition">
              <div class="relative z-10">
                <p class="text-caption uppercase tracking-wide text-ink-muted mb-xs">Shop</p>
                <h3 class="text-h2 text-ink font-serif group-hover:text-gold transition">
                  {{ c.name }}
                </h3>
                <p class="text-body-sm text-ink-muted mt-xs line-clamp-2 max-w-[24ch]">
                  {{ c.description }}
                </p>
                <span class="inline-block mt-md text-caption uppercase tracking-wide text-gold group-hover:translate-x-1 transition">
                  Explore →
                </span>
              </div>
            </div>
          </a>
        }
      </div>
    </section>

    <!-- New arrivals -->
    <section class="bg-bg-muted">
      <div class="container-page py-2xl">
        <div class="flex items-baseline justify-between mb-xl">
          <h2 class="text-h2 text-ink">New arrivals</h2>
          <span class="text-caption uppercase tracking-wide text-ink-muted">Fresh this week</span>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-lg">
          @for (p of fresh()?.items ?? []; track p.slug) {
            <sf-product-card [product]="p" />
          }
        </div>
      </div>
    </section>
  `,
})
export class HomeComponent implements OnInit {
  private readonly categoriesService = inject(CategoriesService);
  private readonly productsService = inject(ProductsService);
  private readonly seo = inject(SeoService);

  readonly categories = toSignal(this.categoriesService.list(), { initialValue: [] });
  readonly fresh = toSignal(this.productsService.list({ fresh: true, take: 8 }));

  ngOnInit() {
    this.seo.applyBasic({
      title: 'Fine jewelry for every occasion',
      description: 'Certified 22K & 24K gold, ethically-sourced diamonds, and hand-finished silver — priced at today\'s live metal rate.',
      canonicalPath: '/',
    });
  }
}
