import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'sf-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="hairline bg-bg-elevated">
      <div class="container-page flex items-center justify-between py-md gap-xl">
        <a routerLink="/" class="font-serif text-h3 text-ink tracking-tight">
          e<span class="text-gold">·</span>com-shop
        </a>

        <nav class="hidden lg:flex items-center gap-xl text-caption uppercase tracking-wide text-ink" aria-label="Primary">
          @for (n of nav; track n.slug) {
            <a
              [routerLink]="'/c/' + n.slug"
              routerLinkActive="text-gold"
              class="hover:text-gold transition">
              {{ n.label }}
            </a>
          }
        </nav>

        <div class="flex items-center gap-md text-ink">
          <button aria-label="Search"  class="p-xs hover:text-gold transition">🔍</button>
          <button aria-label="Account" class="p-xs hover:text-gold transition">👤</button>
          <button aria-label="Wishlist" class="p-xs hover:text-gold transition">♥</button>
          <button aria-label="Cart" class="p-xs hover:text-gold transition relative">
            🛒
            <span class="absolute -top-1 -right-1 bg-gold text-bg text-caption rounded-full w-4 h-4 flex items-center justify-center num-tabular">0</span>
          </button>
        </div>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  readonly nav = [
    { slug: 'gold-rings',      label: 'Rings' },
    { slug: 'diamond-jewelry', label: 'Diamond' },
    { slug: 'silver-collection', label: 'Silver' },
  ];
}
