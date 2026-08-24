import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api-base';
import { ActiveAnnouncement } from './api.types';

@Injectable({ providedIn: 'root' })
export class AnnouncementsService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  active(): Observable<ActiveAnnouncement | null> {
    return this.http.get<ActiveAnnouncement | null>(`${this.base}/public/announcements/active`);
  }
}
