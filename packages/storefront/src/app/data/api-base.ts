import { InjectionToken, inject } from '@angular/core';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => 'http://localhost:3000/api',
});

export function apiUrl(path: string): string {
  const base = inject(API_BASE_URL);
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
