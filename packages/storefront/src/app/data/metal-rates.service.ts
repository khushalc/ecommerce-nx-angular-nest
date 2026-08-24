import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api-base';
import { TodayRates } from './api.types';

@Injectable({ providedIn: 'root' })
export class MetalRatesService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  today(): Observable<TodayRates> {
    return this.http.get<TodayRates>(`${this.base}/public/metal-rates/today`);
  }
}
