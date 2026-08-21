import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api-base';
import { Paginated, ProductSummary } from './api.types';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list(opts: { category?: string; fresh?: boolean; take?: number; skip?: number } = {}): Observable<Paginated<ProductSummary>> {
    let params = new HttpParams();
    if (opts.category) params = params.set('category', opts.category);
    if (opts.fresh)    params = params.set('fresh', String(opts.fresh));
    if (opts.take)     params = params.set('take', String(opts.take));
    if (opts.skip)     params = params.set('skip', String(opts.skip));
    return this.http.get<Paginated<ProductSummary>>(`${this.base}/public/products`, { params });
  }

  bySlug(slug: string): Observable<ProductSummary> {
    return this.http.get<ProductSummary>(`${this.base}/public/products/${slug}`);
  }
}
