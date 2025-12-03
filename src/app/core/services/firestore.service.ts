import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { FakeFirestoreService } from './fake-firestore.service';
import { Observable } from 'rxjs';

export interface DocumentData {
  [key: string]: any;
}

export interface QueryConstraint {
  type: string;
  field?: string;
  operator?: string;
  value?: any;
  direction?: 'asc' | 'desc';
}

/**
 * Firestore Service
 * Delegates to FakeFirestoreService or Firebase Firestore based on environment.useFakeAuth
 */
@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private fakeFirestore = inject(FakeFirestoreService);

  constructor() {
    // When useFakeAuth is true (default in development), this service uses FakeFirestoreService.
    // To use real Firebase Firestore, set useFakeAuth to false and ensure Firebase is properly configured.
  }

  /**
   * Get the active firestore implementation (synchronous version)
   */
  private getFirestoreImplSync() {
    // Always use fake firestore for now since Firebase initialization is async
    // To use Firebase, set useFakeAuth to false and ensure Firebase is properly configured
    return this.fakeFirestore;
  }

  getDocument<T = DocumentData>(path: string): Observable<T | null> {
    const impl = this.getFirestoreImplSync();
    return impl.getDocument<T>(path);
  }

  getCollection<T = DocumentData>(
    path: string,
    ...queryConstraints: QueryConstraint[]
  ): Observable<T[]> {
    const impl = this.getFirestoreImplSync();
    return impl.getCollection<T>(path, ...queryConstraints);
  }

  getCollectionSnapshot<T = DocumentData>(
    path: string,
    ...queryConstraints: QueryConstraint[]
  ): Observable<(T & { id: string })[]> {
    const impl = this.getFirestoreImplSync();
    return impl.getCollectionSnapshot<T>(path, ...queryConstraints);
  }

  getUserCollection<T = DocumentData>(
    path: string,
    userId: string,
    ...additionalConstraints: QueryConstraint[]
  ): Observable<T[]> {
    const impl = this.getFirestoreImplSync();
    // Filter by userId - works for both fake and real Firestore
    const constraints = [
      { type: 'where', field: 'userId', operator: '==', value: userId },
      ...additionalConstraints
    ];
    return impl.getCollection<T>(path, ...constraints);
  }

  setDocument<T = DocumentData>(path: string, data: Partial<T>): Observable<void> {
    const impl = this.getFirestoreImplSync();
    return impl.setDocument<T>(path, data);
  }

  updateDocument<T = DocumentData>(path: string, data: Partial<T>): Observable<void> {
    const impl = this.getFirestoreImplSync();
    return impl.updateDocument<T>(path, data);
  }

  deleteDocument(path: string): Observable<void> {
    const impl = this.getFirestoreImplSync();
    return impl.deleteDocument(path);
  }

  orderByField(field: string, direction: 'asc' | 'desc' = 'desc'): QueryConstraint {
    const impl = this.getFirestoreImplSync();
    if (impl.orderByField) {
      return impl.orderByField(field, direction);
    }
    return { type: 'orderBy', field, direction };
  }

  limitResults(count: number): QueryConstraint {
    const impl = this.getFirestoreImplSync();
    if (impl.limitResults) {
      return impl.limitResults(count);
    }
    return { type: 'limit', value: count };
  }

  whereField(field: string, operator: '==' | '!=' | '<' | '<=' | '>' | '>=', value: any): QueryConstraint {
    const impl = this.getFirestoreImplSync();
    if (impl.whereField) {
      return impl.whereField(field, operator, value);
    }
    return { type: 'where', field, operator, value };
  }
}
