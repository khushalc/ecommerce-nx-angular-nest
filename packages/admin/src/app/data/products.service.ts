import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api-base';
import { CreateProductPayload, Paginated, Product } from './api.types';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list(opts: { search?: string; categoryId?: string; take?: number; skip?: number } = {}): Observable<Paginated<Product>> {
    let params = new HttpParams();
    if (opts.search) params = params.set('search', opts.search);
    if (opts.categoryId) params = params.set('categoryId', opts.categoryId);
    if (opts.take != null) params = params.set('take', String(opts.take));
    if (opts.skip != null) params = params.set('skip', String(opts.skip));
    return this.http.get<Paginated<Product>>(`${this.base}/admin/products`, { params });
  }

  byId(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.base}/admin/products/${id}`);
  }

  create(payload: CreateProductPayload): Observable<Product> {
    return this.http.post<Product>(`${this.base}/admin/products`, payload);
  }

  update(id: string, payload: Partial<CreateProductPayload>): Observable<Product> {
    return this.http.patch<Product>(`${this.base}/admin/products/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/products/${id}`);
  }

  presignUpload(filename: string, contentType: string): Observable<{ uploadUrl: string; publicUrl: string; expiresIn: number }> {
    return this.http.post<{ uploadUrl: string; publicUrl: string; expiresIn: number }>(
      `${this.base}/admin/products/upload-url`,
      { filename, contentType },
    );
  }

  // ── Bulk actions ────────────────────────────────────────────────────

  bulkSetDiscount(productIds: string[], pct: number) {
    return this.http.post<{ updated: number }>(`${this.base}/admin/products/bulk/discount`, { productIds, pct });
  }

  bulkClearDiscount(productIds: string[]) {
    return this.http.post<{ updated: number }>(`${this.base}/admin/products/bulk/discount/clear`, { productIds });
  }

  bulkSetFresh(productIds: string[], value: boolean) {
    return this.http.post<{ updated: number }>(`${this.base}/admin/products/bulk/fresh`, { productIds, value });
  }

  bulkSetActive(productIds: string[], value: boolean) {
    return this.http.post<{ updated: number }>(`${this.base}/admin/products/bulk/active`, { productIds, value });
  }

  bulkChangeCategory(productIds: string[], categoryId: string) {
    return this.http.post<{ updated: number }>(`${this.base}/admin/products/bulk/category`, { productIds, categoryId });
  }
}
