import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserStoreService } from '../../../core/services/user-store.service';
import { emailValidator } from '../../../shared/utils/validators';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LoadingSpinnerComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly userStoreService = inject(UserStoreService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, emailValidator()]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    this.authService.signInWithEmailPassword(email, password).subscribe({
      next: () => {
        // UserStoreService will automatically update on auth state change
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/payments';
        this.router.navigate([returnUrl]);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Invalid email or password');
        this.isLoading.set(false);
      }
    });
  }

  async onGoogleSignIn(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      await this.authService.signInWithGoogle().toPromise();
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/payments';
      this.router.navigate([returnUrl]);
      this.isLoading.set(false);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to sign in with Google');
      this.isLoading.set(false);
    }
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
