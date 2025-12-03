import { HttpInterceptorFn, HttpHeaders } from '@angular/common/http';

/**
 * Security Interceptor
 * Adds security headers to all HTTP requests/responses
 * Note: Some headers are response headers and should be set on the server
 * This interceptor adds request headers that can be helpful
 */
export const securityInterceptor: HttpInterceptorFn = (req, next) => {
  // Add security-related request headers
  const secureHeaders = new HttpHeaders({
    'X-Content-Type-Options': 'nosniff',
    'X-Requested-With': 'XMLHttpRequest'
  });

  const secureRequest = req.clone({
    headers: secureHeaders
  });

  return next(secureRequest);
};
