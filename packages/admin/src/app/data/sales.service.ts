import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api-base';
import { CreateSalePayload, Sale, SaleTargetInput } from './api.types';

@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list(): Observable<Sale[]> {
    return this.http.get<Sale[]>(`${this.base}/admin/sales`);
  }

  byId(id: string): Observable<Sale> {
    return this.http.get<Sale>(`${this.base}/admin/sales/${id}`);
  }

  create(payload: CreateSalePayload): Observable<Sale> {
    return this.http.post<Sale>(`${this.base}/admin/sales`, payload);
  }

  update(id: string, payload: Partial<CreateSalePayload>): Observable<Sale> {
    return this.http.patch<Sale>(`${this.base}/admin/sales/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/sales/${id}`);
  }

  setTargets(id: string, targets: SaleTargetInput[]): Observable<Sale> {
    return this.http.put<Sale>(`${this.base}/admin/sales/${id}/targets`, { targets });
  }
}
