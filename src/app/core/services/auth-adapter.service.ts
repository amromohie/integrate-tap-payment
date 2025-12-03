import { Observable, from, map } from 'rxjs';
import {
  Auth,
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
  UserCredential as FirebaseUserCredential,
  getIdToken
} from '@angular/fire/auth';
import { AuthUser, UserCredential, User } from './auth.service';

/**
 * Adapter to convert Firebase Auth to our AuthService interface
 */
export class FirebaseAuthAdapter {
  constructor(private auth: Auth) {}

  signInWithEmailPassword(email: string, password: string): Observable<UserCredential> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      map((cred: FirebaseUserCredential) => ({
        user: this.convertFirebaseUser(cred.user)
      }))
    );
  }

  signUpWithEmailPassword(email: string, password: string): Observable<UserCredential> {
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      map((cred: FirebaseUserCredential) => ({
        user: this.convertFirebaseUser(cred.user)
      }))
    );
  }

  signInWithGoogle(): Observable<UserCredential> {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    return from(signInWithPopup(this.auth, provider)).pipe(
      map((cred: FirebaseUserCredential) => ({
        user: this.convertFirebaseUser(cred.user)
      }))
    );
  }

  signOut(): Observable<void> {
    return from(signOut(this.auth));
  }

  getCurrentUser(): Observable<User | null> {
    return new Observable<User | null>(observer => {
      const unsubscribe = this.auth.onAuthStateChanged(
        (user: FirebaseUser | null) => {
          observer.next(user ? this.convertFirebaseUser(user) as User : null);
        },
        (error: Error) => {
          observer.error(error);
        }
      );
      return unsubscribe;
    });
  }

  getIdToken(forceRefresh = false): Observable<string | null> {
    if (!this.auth.currentUser) {
      return new Observable<string | null>(observer => {
        observer.next(null);
        observer.complete();
      });
    }
    return from(getIdToken(this.auth.currentUser, forceRefresh));
  }

  getCurrentUserAsAuthUser(): Observable<AuthUser | null> {
    return this.getCurrentUser().pipe(
      map(user => user ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      } : null)
    );
  }

  isAuthenticated(): boolean {
    return !!this.auth.currentUser;
  }

  private convertFirebaseUser(user: FirebaseUser): AuthUser {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    };
  }
}

