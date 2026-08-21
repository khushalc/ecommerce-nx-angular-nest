import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AnnouncementBarComponent } from './announcement-bar.component';
import { GoldRateTickerComponent } from './gold-rate-ticker.component';
import { HeaderComponent } from './header.component';
import { TrustBadgesComponent } from './trust-badges.component';
import { FooterComponent } from './footer.component';
import { MobileBottomNavComponent } from './mobile-bottom-nav.component';

@Component({
  selector: 'sf-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    AnnouncementBarComponent,
    GoldRateTickerComponent,
    HeaderComponent,
    TrustBadgesComponent,
    FooterComponent,
    MobileBottomNavComponent,
  ],
  template: `
    <sf-announcement-bar />
    <sf-gold-rate-ticker />
    <sf-header />
    <main class="min-h-[60vh] pb-16 lg:pb-0">
      <router-outlet />
    </main>
    <sf-trust-badges />
    <sf-footer />
    <sf-mobile-bottom-nav />
  `,
})
export class ShellComponent {}
