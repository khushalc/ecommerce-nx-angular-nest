import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'sf-announcement-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <aside role="region" aria-label="Announcement" class="bg-ink text-bg text-caption">
        <div class="container-page flex items-center gap-md py-sm">
          <p class="flex-1 text-center uppercase tracking-wide">
            Diwali sale live — up to 20% off making charges.
            <a href="/c/gold-rings" class="underline decoration-gold-soft underline-offset-4 hover:text-gold-soft transition">Shop now →</a>
          </p>
          <button
            type="button"
            (click)="dismiss()"
            class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-bg-muted hover:bg-white/10 hover:text-bg transition text-base leading-none"
            aria-label="Dismiss announcement">
            ✕
          </button>
        </div>
      </aside>
    }
  `,
})
export class AnnouncementBarComponent {
  visible = signal(true);
  dismiss() { this.visible.set(false); }
}
