import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

/**
 * Error Interceptor
 * Centralized error handling for HTTP requests
 * Logs errors securely and provides user-friendly error messages
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Log error securely (don't log sensitive data)
      console.error('HTTP Error:', {
        url: req.url,
        method: req.method,
        status: error.status,
        statusText: error.statusText
        // Do not log request/response bodies as they may contain sensitive data
      });

      // Handle different error types
      let errorMessage = 'An error occurred. Please try again.';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = 'Network error. Please check your connection.';
      } else {
        // Server-side error
        switch (error.status) {
          case 0:
            errorMessage = 'Unable to connect to server. Please check your connection.';
            break;
          case 400:
            errorMessage = error.error?.message || 'Invalid request. Please check your input.';
            break;
          case 401:
            errorMessage = 'Authentication required. Please sign in.';
            break;
          case 403:
            errorMessage = 'You do not have permission to perform this action.';
            break;
          case 404:
            errorMessage = 'Resource not found.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
        }
      }

      // Return error with user-friendly message
      return throwError(() => new Error(errorMessage));
    })
  );
};
