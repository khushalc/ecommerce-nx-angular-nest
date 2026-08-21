import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'sf-trust-badges',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bg-bg-muted border-y border-line">
      <div class="container-page grid grid-cols-2 md:grid-cols-4 gap-md py-lg">
        @for (b of badges; track b.title) {
          <div class="flex items-center gap-sm">
            <span class="text-h3" aria-hidden="true">{{ b.icon }}</span>
            <div>
              <div class="text-body-sm font-medium text-ink">{{ b.title }}</div>
              <div class="text-caption uppercase tracking-wide text-ink-muted">{{ b.sub }}</div>
            </div>
          </div>
        }
      </div>
    </section>
  `,
})
export class TrustBadgesComponent {
  readonly badges = [
    { icon: '🛡',  title: 'BIS Hallmark',       sub: 'Certified purity' },
    { icon: '📜',  title: 'IGI Certified',       sub: 'Every diamond' },
    { icon: '🚚',  title: 'Free Insured Shipping', sub: 'On orders above ₹5,000' },
    { icon: '⇄',  title: '15-Day Exchange',    sub: 'No questions asked' },
  ];
}
