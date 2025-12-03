import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-protected-route',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  template: `
    @if (isLoading) {
      <app-loading-spinner />
    } @else {
      <ng-content />
    }
  `
})
export class ProtectedRouteComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  isLoading = true;

  constructor() {
    this.authService.getCurrentUser().subscribe(user => {
      this.isLoading = false;
      if (!user) {
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
