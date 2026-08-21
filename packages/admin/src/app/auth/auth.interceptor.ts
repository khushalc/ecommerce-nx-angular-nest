import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.accessToken();

  const withAuth = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(withAuth).pipe(
    catchError((err) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        auth.logout();
      }
      return throwError(() => err);
    }),
  );
};
