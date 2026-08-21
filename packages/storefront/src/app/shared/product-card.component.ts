import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MoneyPipe } from './money.pipe';
import { ProductSummary } from '../data/api.types';

@Component({
  selector: 'sf-product-card',
  standalone: true,
  imports: [RouterLink, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a [routerLink]="'/p/' + product().slug" class="group block">
      <div class="relative aspect-[4/5] bg-bg-muted overflow-hidden">
        <img
          [src]="product().images[0]"
          [alt]="product().name"
          loading="lazy"
          class="w-full h-full object-cover transition duration-500 group-hover:scale-105" />

        @if (product().isFresh) {
          <span class="absolute top-md left-md badge badge-gold">New</span>
        }
        @if (product().specialDiscount > 0) {
          <span class="absolute top-md right-md badge badge-danger">−{{ product().specialDiscount }}%</span>
        }
      </div>

      <div class="mt-sm space-y-xs">
        <h3 class="text-body font-medium text-ink line-clamp-1 group-hover:text-gold transition">
          {{ product().name }}
        </h3>
        <p class="text-caption uppercase tracking-wide text-ink-muted">
          @if (product().metal && product().purity) {
            {{ product().purity }} · {{ product().weightGrams }}g
          } @else if (product().category.pricingMode === 'FIXED_MRP') {
            {{ product().category.name }}
          }
        </p>
        <div class="flex items-baseline gap-sm">
          <span class="text-price text-ink num-tabular">{{ product().price.finalPrice | money }}</span>
          @if (product().price.discountPct > 0) {
            <span class="text-caption text-ink-subtle line-through num-tabular">
              {{ product().price.listPrice | money }}
            </span>
          }
        </div>
      </div>
    </a>
  `,
})
export class ProductCardComponent {
  product = input.required<ProductSummary>();
}
