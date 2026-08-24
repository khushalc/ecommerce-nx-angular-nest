import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AnnouncementsService } from '../data/announcements.service';

@Component({
  selector: 'sf-announcement-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let a = announcement();
    @if (a && visible()) {
      <aside role="region" aria-label="Announcement" class="bg-ink text-bg text-caption">
        <div class="container-page flex items-center gap-md py-sm">
          <p class="flex-1 text-center uppercase tracking-wide">
            {{ a.bannerLabel }}
            @if (a.ctaLabel && a.ctaHref) {
              <a [href]="a.ctaHref" class="underline decoration-gold-soft underline-offset-4 hover:text-gold-soft transition ml-sm">
                {{ a.ctaLabel }} →
              </a>
            }
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
  private readonly announcementsService = inject(AnnouncementsService);
  readonly announcement = toSignal(this.announcementsService.active(), { initialValue: null });
  readonly visible = signal(true);

  dismiss() { this.visible.set(false); }
}
