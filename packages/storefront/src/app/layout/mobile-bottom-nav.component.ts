import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'sf-mobile-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-bg-elevated border-t border-line" aria-label="Mobile">
      <ul class="grid grid-cols-5 text-caption uppercase tracking-wide">
        @for (n of items; track n.label) {
          <li>
            <a
              [routerLink]="n.href"
              [routerLinkActiveOptions]="{ exact: n.exact ?? false }"
              routerLinkActive="text-gold"
              class="flex flex-col items-center gap-xs py-sm text-ink hover:text-gold transition">
              <span aria-hidden="true">{{ n.icon }}</span>
              {{ n.label }}
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
})
export class MobileBottomNavComponent {
  readonly items = [
    { label: 'Home',     href: '/',                     icon: '🏠', exact: true },
    { label: 'Shop',     href: '/c/gold-rings',         icon: '💍' },
    { label: 'Wishlist', href: '/wishlist',             icon: '♥' },
    { label: 'Cart',     href: '/cart',                 icon: '🛒' },
    { label: 'Account',  href: '/account',              icon: '👤' },
  ];
}
