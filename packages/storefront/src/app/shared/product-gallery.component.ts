import { ChangeDetectionStrategy, Component, HostListener, computed, input, signal } from '@angular/core';

@Component({
  selector: 'sf-product-gallery',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-sm">
      <!-- Main image -->
      <div
        class="relative aspect-[4/5] bg-bg-muted overflow-hidden border border-line"
        (pointerdown)="onPointerDown($event)"
        (pointerup)="onPointerUp($event)"
        (pointercancel)="pointerStartX.set(null)"
        tabindex="0"
        role="region"
        aria-label="Product images">
        @for (img of images(); track $index; let i = $index) {
          <img
            [src]="img"
            [alt]="alt() + ' — image ' + (i + 1) + ' of ' + images().length"
            [class.opacity-100]="i === current()"
            [class.opacity-0]="i !== current()"
            [class.pointer-events-none]="i !== current()"
            class="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
            [attr.loading]="i === 0 ? 'eager' : 'lazy'" />
        }

        @if (multiple()) {
          <button
            type="button"
            (click)="prev()"
            class="absolute left-md top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-bg-elevated/90 shadow-md flex items-center justify-center text-h3 text-ink hover:bg-bg-elevated transition"
            aria-label="Previous image">
            ‹
          </button>
          <button
            type="button"
            (click)="next()"
            class="absolute right-md top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-bg-elevated/90 shadow-md flex items-center justify-center text-h3 text-ink hover:bg-bg-elevated transition"
            aria-label="Next image">
            ›
          </button>
          <div class="absolute bottom-md right-md bg-ink/75 text-bg text-caption px-sm py-xs rounded-full num-tabular pointer-events-none">
            {{ current() + 1 }} / {{ images().length }}
          </div>
        }
      </div>

      <!-- Thumbnails -->
      @if (multiple()) {
        <div class="grid gap-xs" [style.gridTemplateColumns]="'repeat(' + images().length + ', minmax(0, 1fr))'">
          @for (img of images(); track $index; let i = $index) {
            <button
              type="button"
              (click)="goto(i)"
              [class.border-gold]="i === current()"
              [class.border-transparent]="i !== current()"
              class="aspect-[4/5] border-2 overflow-hidden hover:border-gold-soft transition"
              [attr.aria-label]="'Show image ' + (i + 1)"
              [attr.aria-current]="i === current() ? 'true' : null">
              <img [src]="img" alt="" class="w-full h-full object-cover" loading="lazy" />
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class ProductGalleryComponent {
  images = input.required<string[]>();
  alt = input.required<string>();

  readonly current = signal(0);
  readonly multiple = computed(() => this.images().length > 1);

  readonly pointerStartX = signal<number | null>(null);
  private readonly SWIPE_THRESHOLD = 40;

  next() {
    const n = this.images().length;
    if (n < 2) return;
    this.current.update((i) => (i + 1) % n);
  }

  prev() {
    const n = this.images().length;
    if (n < 2) return;
    this.current.update((i) => (i - 1 + n) % n);
  }

  goto(i: number) {
    this.current.set(i);
  }

  onPointerDown(e: PointerEvent) {
    this.pointerStartX.set(e.clientX);
  }

  onPointerUp(e: PointerEvent) {
    const start = this.pointerStartX();
    this.pointerStartX.set(null);
    if (start == null) return;
    const dx = e.clientX - start;
    if (Math.abs(dx) < this.SWIPE_THRESHOLD) return;
    if (dx < 0) this.next(); else this.prev();
  }

  @HostListener('window:keydown.arrowLeft')
  onLeft() { this.prev(); }

  @HostListener('window:keydown.arrowRight')
  onRight() { this.next(); }
}
