import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserStoreService } from '../../../core/services/user-store.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  private readonly userStoreService = inject(UserStoreService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.userStoreService.user;
  readonly isAuthenticated = this.userStoreService.isAuthenticated;

  async onSignOut(): Promise<void> {
    try {
      await this.authService.signOut().toPromise();
      this.userStoreService.clearUser();
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }
}
