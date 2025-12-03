import { inject, Injectable, signal, computed } from '@angular/core';
import { AuthService, AuthUser } from './auth.service';
import { FirestoreService } from './firestore.service';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt?: Date;
  updatedAt?: Date;
  roles?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UserStoreService {
  private readonly authService = inject(AuthService);
  private readonly firestoreService = inject(FirestoreService);

  // Signal-based user state
  readonly user = signal<AuthUser | null>(null);
  readonly userProfile = signal<UserProfile | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Computed signals
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly userRoles = computed(() => this.userProfile()?.roles || []);

  constructor() {
    // Subscribe to auth state changes
    this.authService.getCurrentUser().subscribe(user => {
      if (user) {
        this.user.set({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        });
        // Load user profile from Firestore
        this.loadUserProfile(user.uid);
      } else {
        this.user.set(null);
        this.userProfile.set(null);
      }
    });
  }

  /**
   * Load user profile from Firestore
   * Creates profile if it doesn't exist
   */
  private loadUserProfile(uid: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.firestoreService.getDocument<UserProfile>(`users/${uid}`).subscribe({
      next: (profile) => {
        if (profile) {
          this.userProfile.set(profile);
        } else {
          // Create initial profile
          this.createInitialProfile(uid);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading user profile:', err);
        this.error.set('Failed to load user profile');
        this.isLoading.set(false);
        // Try to create profile anyway
        this.createInitialProfile(uid);
      }
    });
  }

  /**
   * Create initial user profile in Firestore
   */
  private createInitialProfile(uid: string): void {
    const currentUser = this.user();
    if (!currentUser) return;

    const profile: UserProfile = {
      uid,
      email: currentUser.email || '',
      displayName: currentUser.displayName || undefined,
      photoURL: currentUser.photoURL || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      roles: ['user'] // Default role
    };

    this.firestoreService.setDocument(`users/${uid}`, profile).subscribe({
      next: () => {
        this.userProfile.set(profile);
      },
      error: (err) => {
        console.error('Error creating user profile:', err);
        this.error.set('Failed to create user profile');
      }
    });
  }

  /**
   * Update user profile in Firestore
   */
  updateProfile(updates: Partial<UserProfile>): Observable<void> {
    const uid = this.user()?.uid;
    if (!uid) {
      return of(undefined);
    }

    const updatedProfile = {
      ...updates,
      updatedAt: new Date()
    };

    return this.firestoreService.updateDocument(`users/${uid}`, updatedProfile).pipe(
      tap(() => {
        const currentProfile = this.userProfile();
        if (currentProfile) {
          this.userProfile.set({ ...currentProfile, ...updatedProfile });
        }
      }),
      catchError(err => {
        console.error('Error updating profile:', err);
        this.error.set('Failed to update profile');
        throw err;
      })
    );
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    return this.userRoles().includes(role);
  }

  /**
   * Clear user state (on logout)
   */
  clearUser(): void {
    this.user.set(null);
    this.userProfile.set(null);
    this.error.set(null);
  }
}
