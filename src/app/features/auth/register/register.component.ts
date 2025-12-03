import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserStoreService } from '../../../core/services/user-store.service';
import { emailValidator, passwordStrengthValidator, passwordMatchValidator } from '../../../shared/utils/validators';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LoadingSpinnerComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly userStoreService = inject(UserStoreService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  registerForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, emailValidator()]],
    password: ['', [Validators.required, passwordStrengthValidator()]],
    confirmPassword: ['', [Validators.required]]
  }, {
    validators: passwordMatchValidator('password')
  });

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.registerForm.value;

    this.authService.signUpWithEmailPassword(email, password).subscribe({
      next: () => {
        // UserStoreService will create user profile in Firestore
        this.router.navigate(['/payments']);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Registration failed. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  async onGoogleSignIn(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      await this.authService.signInWithGoogle().toPromise();
      this.router.navigate(['/payments']);
      this.isLoading.set(false);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to sign in with Google');
      this.isLoading.set(false);
    }
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }

  getPasswordStrengthErrors(): string[] {
    const errors: string[] = [];
    const passwordErrors = this.password?.errors?.['passwordStrength'];
    
    if (passwordErrors) {
      if (passwordErrors.minLength) {
        errors.push('At least 8 characters');
      }
      if (passwordErrors.uppercase) {
        errors.push('One uppercase letter');
      }
      if (passwordErrors.lowercase) {
        errors.push('One lowercase letter');
      }
      if (passwordErrors.number) {
        errors.push('One number');
      }
    }
    
    return errors;
  }
}
