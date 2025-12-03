import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, of, delay, throwError } from 'rxjs';
import { AuthUser, UserCredential } from './auth.service';

/**
 * Fake Auth Service
 * Simulates Firebase Auth for development/testing without requiring Firebase setup
 * Use this by setting environment.useFakeAuth = true
 */
@Injectable({
  providedIn: 'root'
})
export class FakeAuthService {
  // In-memory user storage
  private users: Map<string, { email: string; password: string; user: AuthUser }> = new Map();
  private currentUserSubject = signal<AuthUser | null>(null);

  constructor() {
    // Pre-create a test user
    const testUser: AuthUser = {
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null
    };
    this.users.set('test@example.com', {
      email: 'test@example.com',
      password: 'password123', // For demo purposes
      user: testUser
    });
  }

  /**
   * Sign in with email and password
   */
  signInWithEmailPassword(email: string, password: string): Observable<UserCredential> {
    return new Observable(observer => {
      // Simulate network delay
      setTimeout(() => {
        const userData = this.users.get(email);
        
        if (userData && userData.password === password) {
          this.currentUserSubject.set(userData.user);
          observer.next({ user: userData.user });
          observer.complete();
        } else {
          observer.error(new Error('Invalid email or password'));
        }
      }, 500);
    });
  }

  /**
   * Register new user with email and password
   */
  signUpWithEmailPassword(email: string, password: string): Observable<UserCredential> {
    return new Observable(observer => {
      setTimeout(() => {
        if (this.users.has(email)) {
          observer.error(new Error('Email already registered'));
          return;
        }

        const newUser: AuthUser = {
          uid: `user-${Date.now()}`,
          email,
          displayName: email.split('@')[0],
          photoURL: null
        };

        this.users.set(email, {
          email,
          password,
          user: newUser
        });

        this.currentUserSubject.set(newUser);
        observer.next({ user: newUser });
        observer.complete();
      }, 500);
    });
  }

  /**
   * Sign in with Google (fake)
   */
  signInWithGoogle(): Observable<UserCredential> {
    return new Observable(observer => {
      setTimeout(() => {
        const googleUser: AuthUser = {
          uid: 'google-user-123',
          email: 'google.user@example.com',
          displayName: 'Google User',
          photoURL: 'https://via.placeholder.com/150'
        };

        this.currentUserSubject.set(googleUser);
        observer.next({ user: googleUser });
        observer.complete();
      }, 500);
    });
  }

  /**
   * Sign out current user
   */
  signOut(): Observable<void> {
    return new Observable(observer => {
      setTimeout(() => {
        this.currentUserSubject.set(null);
        observer.next();
        observer.complete();
      }, 200);
    });
  }

  /**
   * Get current authenticated user
   * Returns an Observable that emits whenever the user state changes
   */
  getCurrentUser(): Observable<AuthUser | null> {
    // Convert signal to Observable to emit changes continuously
    return toObservable(this.currentUserSubject);
  }

  /**
   * Get current user's ID token (fake token)
   */
  getIdToken(forceRefresh = false): Observable<string | null> {
    const user = this.currentUserSubject();
    if (!user) {
      return of(null);
    }
    
    // Return a fake token
    const fakeToken = `fake-token-${user.uid}-${Date.now()}`;
    return of(fakeToken).pipe(delay(100));
  }

  /**
   * Get current user as AuthUser object
   */
  getCurrentUserAsAuthUser(): Observable<AuthUser | null> {
    return this.getCurrentUser();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUserSubject() !== null;
  }

  /**
   * Get current user signal (for direct access)
   */
  getUserSignal() {
    return this.currentUserSubject.asReadonly();
  }
}

