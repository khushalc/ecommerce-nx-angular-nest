import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api-base';
import { CategorySummary, CategoryWithProducts } from './api.types';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list(): Observable<CategorySummary[]> {
    return this.http.get<CategorySummary[]>(`${this.base}/public/categories`);
  }

  bySlug(slug: string): Observable<CategoryWithProducts> {
    return this.http.get<CategoryWithProducts>(`${this.base}/public/categories/${slug}`);
  }
}
