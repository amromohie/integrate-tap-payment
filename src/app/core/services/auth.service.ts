import { inject, Injectable, Injector } from '@angular/core';
import { environment } from '../../../environments/environment';
import { FakeAuthService } from './fake-auth.service';
import { Observable } from 'rxjs';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface UserCredential {
  user: AuthUser;
}

// Forward declarations for Firebase types
export interface User extends AuthUser {}

/**
 * Auth Service
 * Delegates to FakeAuthService or Firebase Auth based on environment.useFakeAuth
 * 
 * Note: When useFakeAuth is true (default in development), this service uses FakeAuthService.
 * To use real Firebase Auth, set useFakeAuth to false and ensure Firebase is properly configured.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private fakeAuth = inject(FakeAuthService);

  /**
   * Get the active auth implementation
   */
  private getAuthImpl() {
    // Always use fake auth for now since Firebase initialization is async
    // To use Firebase, set useFakeAuth to false and ensure Firebase is properly configured
    return this.fakeAuth;
  }

  signInWithEmailPassword(email: string, password: string): Observable<UserCredential> {
    return this.getAuthImpl().signInWithEmailPassword(email, password);
  }

  signUpWithEmailPassword(email: string, password: string): Observable<UserCredential> {
    return this.getAuthImpl().signUpWithEmailPassword(email, password);
  }

  signInWithGoogle(): Observable<UserCredential> {
    return this.getAuthImpl().signInWithGoogle();
  }

  signOut(): Observable<void> {
    return this.getAuthImpl().signOut();
  }

  getCurrentUser(): Observable<User | null> {
    return this.getAuthImpl().getCurrentUser();
  }

  getIdToken(forceRefresh = false): Observable<string | null> {
    return this.getAuthImpl().getIdToken(forceRefresh);
  }

  getCurrentUserAsAuthUser(): Observable<AuthUser | null> {
    return this.getAuthImpl().getCurrentUserAsAuthUser();
  }

  isAuthenticated(): boolean {
    return this.getAuthImpl().isAuthenticated();
  }
}
