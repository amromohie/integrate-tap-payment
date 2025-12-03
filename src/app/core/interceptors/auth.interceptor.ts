import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, take } from 'rxjs/operators';
import { throwError } from 'rxjs';

/**
 * Auth Interceptor
 * Attaches Firebase ID token to requests that require authentication
 * Handles token refresh and redirects on 401 errors
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if request needs authentication (you can customize this logic)
  const needsAuth = req.url.startsWith('/api/') && !req.url.includes('/public');

  if (!needsAuth) {
    return next(req);
  }

  // Get ID token and attach to request
  return authService.getIdToken().pipe(
    take(1),
    switchMap(token => {
      if (token) {
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next(authReq);
      }
      // No token, proceed without auth header
      return next(req);
    }),
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized - redirect to login
      if (error.status === 401) {
        router.navigate(['/auth/login'], {
          queryParams: { returnUrl: router.url }
        });
      }
      return throwError(() => error);
    })
  );
};
