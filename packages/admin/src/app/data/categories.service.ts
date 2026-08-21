import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api-base';
import { Category } from './api.types';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.base}/admin/categories`);
  }

  byId(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.base}/admin/categories/${id}`);
  }
}
