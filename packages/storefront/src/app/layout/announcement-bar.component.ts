import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'sf-announcement-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div class="bg-ink text-bg text-caption">
        <div class="container-page flex items-center justify-between py-xs">
          <button
            type="button"
            (click)="dismiss()"
            class="text-ink-subtle hover:text-bg-muted transition"
            aria-label="Dismiss announcement">
            ✕
          </button>
          <p class="uppercase tracking-wide">
            Diwali sale live — up to 20% off making charges. <a href="/c/gold-rings" class="underline decoration-gold-soft underline-offset-4">Shop now →</a>
          </p>
          <span class="w-4"></span>
        </div>
      </div>
    }
  `,
})
export class AnnouncementBarComponent {
  visible = signal(true);
  dismiss() { this.visible.set(false); }
}
