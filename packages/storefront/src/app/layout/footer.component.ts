import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'sf-footer',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="bg-ink text-bg-muted">
      <div class="container-page grid grid-cols-1 md:grid-cols-4 gap-xl py-2xl">
        @for (col of columns; track col.title) {
          <div>
            <h4 class="text-caption uppercase tracking-wide text-bg mb-md">{{ col.title }}</h4>
            <ul class="space-y-xs text-body-sm">
              @for (l of col.links; track l.label) {
                <li><a [routerLink]="l.href" class="text-bg-muted hover:text-gold-soft transition">{{ l.label }}</a></li>
              }
            </ul>
          </div>
        }
      </div>
      <div class="border-t border-ink-muted">
        <div class="container-page py-md text-caption text-ink-subtle flex flex-col md:flex-row justify-between gap-sm">
          <span>© {{ year }} e-com-shop · GST 27ABCDE1234F1Z5</span>
          <span class="space-x-md">
            <a routerLink="/legal/privacy" class="hover:text-bg-muted">Privacy</a>
            <a routerLink="/legal/terms" class="hover:text-bg-muted">Terms</a>
          </span>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  readonly year = 2026;
  readonly columns = [
    {
      title: 'Shop',
      links: [
        { label: 'Rings',     href: '/c/gold-rings' },
        { label: 'Diamond',   href: '/c/diamond-jewelry' },
        { label: 'Silver',    href: '/c/silver-collection' },
      ],
    },
    {
      title: 'Collections',
      links: [
        { label: 'New Arrivals', href: '/new-arrivals' },
        { label: 'Bestsellers',  href: '/bestsellers' },
        { label: 'Bridal',       href: '/collections/bridal' },
      ],
    },
    {
      title: 'Customer Care',
      links: [
        { label: 'Contact us',   href: '/contact' },
        { label: 'Shipping',     href: '/help/shipping' },
        { label: 'Returns',      href: '/help/returns' },
        { label: 'Care Guide',   href: '/help/care' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About',   href: '/about' },
        { label: 'Journal', href: '/journal' },
        { label: 'Careers', href: '/careers' },
        { label: 'Press',   href: '/press' },
      ],
    },
  ];
}
