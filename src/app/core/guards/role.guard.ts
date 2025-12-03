import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { UserStoreService } from '../services/user-store.service';
import { map } from 'rxjs/operators';

/**
 * Role Guard
 * Protects routes that require specific user roles
 * Usage: canActivate: [authGuard, roleGuard(['admin', 'manager'])]
 */
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const userStoreService = inject(UserStoreService);
    const router = inject(Router);

    // Get current user roles from signal
    const userRoles = userStoreService.userRoles();

    // Check if user has at least one of the required roles
    const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));

    if (hasRequiredRole) {
      return true;
    }

    // User doesn't have required role, redirect to home
    router.navigate(['/']);
    return false;
  };
};
