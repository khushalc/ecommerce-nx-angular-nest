import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, tap, throwError, Observable } from 'rxjs';

import { API_BASE_URL } from '../data/api-base';
import { AdminUser, AuthResponse } from '../data/api.types';

const STORAGE_KEY = 'ecom_admin_auth';

interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  user: AdminUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly base = inject(API_BASE_URL);

  private readonly authState = signal<StoredAuth | null>(this.readStorage());

  readonly user = computed(() => this.authState()?.user ?? null);
  readonly isAuthenticated = computed(() => this.authState() !== null);
  readonly accessToken = computed(() => this.authState()?.accessToken ?? null);

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/login`, { email, password }).pipe(
      tap((res) => this.persist(res)),
      catchError((err) => {
        this.clear();
        return throwError(() => err);
      }),
    );
  }

  logout() {
    this.clear();
    this.router.navigateByUrl('/login');
  }

  private persist(res: AuthResponse) {
    const stored: StoredAuth = { accessToken: res.accessToken, refreshToken: res.refreshToken, user: res.user };
    this.authState.set(stored);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    }
  }

  private clear() {
    this.authState.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private readStorage(): StoredAuth | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as StoredAuth; } catch { return null; }
  }
}
