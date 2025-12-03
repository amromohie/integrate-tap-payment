import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Auth routes (public)
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  
  // Protected routes
  {
    path: 'payments',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/payments/payment-list/payment-list.component').then(m => m.PaymentListComponent)
      },
      {
        path: 'new',
        loadComponent: () => import('./features/payments/payment-form/payment-form.component').then(m => m.PaymentFormComponent)
      }
    ]
  },
  
  {
    path: 'maps',
    canActivate: [authGuard],
    loadComponent: () => import('./features/maps/location-picker/location-picker.component').then(m => m.LocationPickerComponent)
  },
  
  // Legacy route (redirect)
  {
    path: 'save-card',
    redirectTo: '/payments/new',
    pathMatch: 'full'
  },
  
  // Default route
  {
    path: '',
    redirectTo: '/payments',
    pathMatch: 'full'
  },
  
  // 404 - redirect to payments
  {
    path: '**',
    redirectTo: '/payments'
  }
];
