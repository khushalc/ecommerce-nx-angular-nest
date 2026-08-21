import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'admin-topbar',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="h-[56px] border-b border-line bg-bg-elevated flex items-center justify-between px-lg">
      <a routerLink="/" class="text-body font-medium text-ink">
        e-com-shop <span class="text-caption uppercase tracking-wide text-ink-subtle ml-xs">admin</span>
      </a>

      <div class="flex items-center gap-md text-body-sm text-ink">
        @if (auth.user(); as u) {
          <span class="text-ink-muted">{{ u.fullName }}</span>
          <span class="badge">{{ u.role }}</span>
          <button type="button" class="admin-btn" (click)="auth.logout()">Log out</button>
        }
      </div>
    </header>
  `,
})
export class AdminTopbarComponent {
  readonly auth = inject(AuthService);
}
