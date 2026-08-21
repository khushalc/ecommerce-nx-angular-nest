import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'admin-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-bg flex items-center justify-center p-lg">
      <div class="w-full max-w-md admin-card p-xl">
        <div class="mb-lg">
          <h1 class="text-h3 text-ink font-medium">Sign in to admin</h1>
          <p class="text-body-sm text-ink-muted mt-xs">e-com-shop management console</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-md">
          <div>
            <label class="admin-label" for="email">Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              autocomplete="username"
              class="admin-input"
              placeholder="admin@ecom-shop.dev" />
          </div>

          <div>
            <label class="admin-label" for="password">Password</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              autocomplete="current-password"
              class="admin-input"
              placeholder="••••••••" />
          </div>

          @if (error()) {
            <p class="text-body-sm text-danger">{{ error() }}</p>
          }

          <button
            type="submit"
            class="admin-btn-primary w-full"
            [disabled]="loading() || form.invalid">
            {{ loading() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>

        <p class="mt-lg text-caption text-ink-subtle text-center">
          Seed credentials: <code class="font-mono">admin&#64;ecom-shop.dev / admin&#64;12345</code>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    email: ['admin@ecom-shop.dev', [Validators.required, Validators.email]],
    password: ['admin@12345', [Validators.required, Validators.minLength(6)]],
  });

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Invalid credentials');
      },
    });
  }
}
