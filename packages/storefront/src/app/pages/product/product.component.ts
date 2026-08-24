import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { switchMap, tap } from 'rxjs';

import { ProductsService } from '../../data/products.service';
import { SeoService } from '../../seo/seo.service';
import { MoneyPipe } from '../../shared/money.pipe';
import { ProductGalleryComponent } from '../../shared/product-gallery.component';

@Component({
  selector: 'sf-product',
  standalone: true,
  imports: [RouterLink, MoneyPipe, DecimalPipe, ProductGalleryComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let p = product();
    @if (p) {
      <div class="container-page py-lg">
        <!-- Breadcrumb -->
        <nav class="text-caption uppercase tracking-wide text-ink-muted mb-md" aria-label="Breadcrumb">
          <a routerLink="/" class="hover:text-gold">Home</a>
          <span class="mx-xs">/</span>
          <a [routerLink]="'/c/' + p.category.slug" class="hover:text-gold">{{ p.category.name }}</a>
          <span class="mx-xs">/</span>
          <span class="text-ink">{{ p.name }}</span>
        </nav>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-2xl">
          <!-- Gallery (carousel with prev/next, thumbs, swipe, keyboard) -->
          <sf-product-gallery [images]="p.images" [alt]="p.name" />

          <!-- Info -->
          <div class="md:sticky md:top-lg h-fit">
            <p class="text-caption uppercase tracking-wide text-ink-muted mb-sm">
              {{ p.category.name }} · SKU {{ p.sku }}
            </p>
            <h1 class="text-h1 text-ink mb-md">{{ p.name }}</h1>

            <!-- Sale banner tag (if this product is in an active sale) -->
            @if (p.sale; as s) {
              <p class="text-caption uppercase tracking-wide text-danger mb-sm">
                ★ {{ s.name }} — {{ s.discountPct }}% off
              </p>
            }

            <!-- Price -->
            <div class="flex items-baseline gap-md mb-md">
              <span class="text-display text-ink num-tabular">{{ p.price.finalPrice | money }}</span>
              @if (p.price.discountPct > 0) {
                <span class="text-h4 text-ink-subtle line-through num-tabular">{{ p.price.listPrice | money }}</span>
                <span class="badge badge-danger">−{{ p.price.discountPct }}%</span>
              }
            </div>

            <!-- Stock -->
            <p
              class="text-body-sm mb-lg"
              [class.text-success]="p.stockDisplay.state === 'IN_STOCK'"
              [class.text-warning]="p.stockDisplay.state === 'LOW'"
              [class.text-info]="p.stockDisplay.state === 'BACKORDER'"
              [class.text-danger]="p.stockDisplay.state === 'OUT_OF_STOCK'">
              ● {{ p.stockDisplay.message }}
            </p>

            <!-- CTA -->
            <div class="flex gap-md mb-xl">
              <button
                type="button"
                class="btn-primary flex-1"
                [disabled]="!p.stockDisplay.canAddToCart">
                Add to cart
              </button>
              <button type="button" class="btn-ghost" aria-label="Add to wishlist">♥</button>
            </div>

            <!-- Specs -->
            @if (p.price.breakdown) {
              <div class="admin-card p-lg mb-lg bg-bg-elevated border border-line">
                <h3 class="text-caption uppercase tracking-wide text-ink-muted mb-sm">Price breakdown</h3>
                <dl class="grid grid-cols-2 gap-y-xs text-body-sm">
                  <dt class="text-ink-muted">Metal ({{ p.purity }}) @ ₹ {{ p.price.breakdown.metalRatePerGram | number:'1.0-0' }}/g</dt>
                  <dd class="text-right num-tabular">{{ p.price.breakdown.metalValue | money }}</dd>

                  <dt class="text-ink-muted">Weight</dt>
                  <dd class="text-right num-tabular">{{ p.price.breakdown.weightGrams }} g</dd>

                  <dt class="text-ink-muted">Making charge ({{ p.makingPct }}%)</dt>
                  <dd class="text-right num-tabular">{{ p.price.breakdown.makingCharge | money }}</dd>

                  @if (p.price.breakdown.stoneValue > 0) {
                    <dt class="text-ink-muted">Stone value</dt>
                    <dd class="text-right num-tabular">{{ p.price.breakdown.stoneValue | money }}</dd>
                  }

                  <dt class="col-span-2 border-t border-line mt-xs pt-xs text-ink">Subtotal</dt>
                  <dd class="col-span-2 text-right text-h4 num-tabular border-t border-line pt-xs">{{ p.price.breakdown.subtotal | money }}</dd>
                </dl>
                <p class="text-caption text-ink-subtle mt-sm">GST applied at checkout.</p>
              </div>
            }

            @if (p.description) {
              <div>
                <h3 class="text-caption uppercase tracking-wide text-ink-muted mb-sm">About this piece</h3>
                <p class="text-body text-ink-muted">{{ p.description }}</p>
              </div>
            }
          </div>
        </div>
      </div>
    } @else if (loading()) {
      <div class="container-page py-4xl text-center text-ink-muted">Loading…</div>
    } @else {
      <div class="container-page py-4xl text-center">
        <h1 class="text-h2 text-ink mb-sm">Product not found</h1>
        <a routerLink="/" class="btn-ghost mt-md">Back home</a>
      </div>
    }
  `,
})
export class ProductComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(ProductsService);
  private readonly seo = inject(SeoService);

  readonly product = toSignal(
    this.route.params.pipe(
      switchMap(({ slug }) =>
        this.productsService.bySlug(slug).pipe(
          tap((p) => this.seo.applyProduct(p)),
        ),
      ),
    ),
  );

  readonly loading = computed(() => this.product() === undefined);
}
