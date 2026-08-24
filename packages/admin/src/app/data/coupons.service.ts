import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api-base';
import { Coupon, CreateCouponPayload } from './api.types';

@Injectable({ providedIn: 'root' })
export class CouponsService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list(): Observable<Coupon[]> {
    return this.http.get<Coupon[]>(`${this.base}/admin/coupons`);
  }

  byId(id: string): Observable<Coupon> {
    return this.http.get<Coupon>(`${this.base}/admin/coupons/${id}`);
  }

  create(payload: CreateCouponPayload): Observable<Coupon> {
    return this.http.post<Coupon>(`${this.base}/admin/coupons`, payload);
  }

  update(id: string, payload: Partial<CreateCouponPayload>): Observable<Coupon> {
    return this.http.patch<Coupon>(`${this.base}/admin/coupons/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/coupons/${id}`);
  }
}
