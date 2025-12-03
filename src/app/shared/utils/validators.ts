import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Custom form validators
 */

/**
 * Email validator with regex pattern
 */
export function emailValidator(): ValidatorFn {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // Don't validate empty values (use required validator)
    }
    
    const isValid = emailRegex.test(control.value);
    return isValid ? null : { email: { value: control.value } };
  };
}

/**
 * Password strength validator
 * Requires: min 8 characters, at least one uppercase, one lowercase, one number
 */
export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    
    const value = control.value;
    const errors: any = {};
    
    if (value.length < 8) {
      errors.minLength = { requiredLength: 8, actualLength: value.length };
    }
    
    if (!/[A-Z]/.test(value)) {
      errors.uppercase = true;
    }
    
    if (!/[a-z]/.test(value)) {
      errors.lowercase = true;
    }
    
    if (!/[0-9]/.test(value)) {
      errors.number = true;
    }
    
    // Optional: require special character
    // if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
    //   errors.specialChar = true;
    // }
    
    return Object.keys(errors).length > 0 ? { passwordStrength: errors } : null;
  };
}

/**
 * Password match validator (for confirm password fields)
 */
export function passwordMatchValidator(passwordControlName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.parent) {
      return null;
    }
    
    const password = control.parent.get(passwordControlName)?.value;
    const confirmPassword = control.value;
    
    if (!password || !confirmPassword) {
      return null;
    }
    
    return password === confirmPassword ? null : { passwordMismatch: true };
  };
}

/**
 * Rate limiting utilities
 */

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for button clicks
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
