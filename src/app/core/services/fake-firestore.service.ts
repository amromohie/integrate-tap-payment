import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

/**
 * Fake Firestore Service
 * Simulates Firestore for development/testing without requiring Firebase setup
 * Stores data in memory
 */
@Injectable({
  providedIn: 'root'
})
export class FakeFirestoreService {
  // In-memory database
  private db: Map<string, any> = new Map();

  getDocument<T = any>(path: string): Observable<T | null> {
    return of(this.db.get(path) || null).pipe(delay(100));
  }

  /**
   * Get all documents from a collection
   */
  getCollection<T = any>(
    path: string,
    ...queryConstraints: any[]
  ): Observable<T[]> {
    return new Observable(observer => {
      setTimeout(() => {
        const prefix = path + '/';
        const documents: T[] = [];
        
        this.db.forEach((value, key) => {
          if (key.startsWith(prefix)) {
            documents.push({ ...value, id: key.split('/').pop() } as T);
          }
        });

        // Apply query constraints (simplified)
        let filtered = documents;
        for (const constraint of queryConstraints) {
          if (constraint && typeof constraint === 'object') {
            if (constraint.type === 'where' && constraint.field) {
              const operator = constraint.operator || '==';
              if (operator === '==') {
                filtered = filtered.filter((doc: any) => 
                  doc[constraint.field] === constraint.value
                );
              } else if (operator === '!=') {
                filtered = filtered.filter((doc: any) => 
                  doc[constraint.field] !== constraint.value
                );
              }
            } else if (constraint.type === 'orderBy' && constraint.field) {
              filtered.sort((a: any, b: any) => {
                const aVal = a[constraint.field];
                const bVal = b[constraint.field];
                if (constraint.direction === 'desc') {
                  return bVal > aVal ? 1 : -1;
                }
                return aVal > bVal ? 1 : -1;
              });
            } else if (constraint.type === 'limit') {
              filtered = filtered.slice(0, constraint.value || filtered.length);
            }
          }
        }

        observer.next(filtered);
        observer.complete();
      }, 100);
    });
  }

  /**
   * Get documents with real-time updates (fake - simulates real-time with periodic updates)
   */
  getCollectionSnapshot<T = any>(
    path: string,
    ...queryConstraints: any[]
  ): Observable<(T & { id: string })[]> {
    // For fake service, return current state and emit updates when data changes
    return new Observable(observer => {
      const emitUpdate = () => {
        const prefix = path + '/';
        const documents: (T & { id: string })[] = [];
        
        this.db.forEach((value, key) => {
          if (key.startsWith(prefix)) {
            documents.push({ ...value, id: key.split('/').pop() } as T & { id: string });
          }
        });

        // Apply query constraints (simplified)
        let filtered = documents;
        for (const constraint of queryConstraints) {
          if (constraint && typeof constraint === 'object') {
            if (constraint.type === 'where' && constraint.field) {
              const operator = constraint.operator || '==';
              if (operator === '==') {
                filtered = filtered.filter((doc: any) => 
                  doc[constraint.field] === constraint.value
                );
              } else if (operator === '!=') {
                filtered = filtered.filter((doc: any) => 
                  doc[constraint.field] !== constraint.value
                );
              }
            } else if (constraint.type === 'orderBy' && constraint.field) {
              filtered.sort((a: any, b: any) => {
                const aVal = a[constraint.field];
                const bVal = b[constraint.field];
                if (constraint.direction === 'desc') {
                  return bVal > aVal ? 1 : -1;
                }
                return aVal > bVal ? 1 : -1;
              });
            } else if (constraint.type === 'limit') {
              filtered = filtered.slice(0, constraint.value || filtered.length);
            }
          }
        }

        observer.next(filtered);
      };

      // Emit initial data
      emitUpdate();

      // For fake service, just emit once (real-time would use Firestore snapshots)
      // In a real scenario, you could set up a polling mechanism here
    });
  }

  setDocument<T = any>(path: string, data: Partial<T>): Observable<void> {
    return new Observable(observer => {
      setTimeout(() => {
        const existingData = this.db.get(path) || {};
        this.db.set(path, { ...existingData, ...data });
        observer.next();
        observer.complete();
      }, 100);
    });
  }

  updateDocument<T = any>(path: string, data: Partial<T>): Observable<void> {
    return new Observable(observer => {
      setTimeout(() => {
        const existingData = this.db.get(path) || {};
        this.db.set(path, { ...existingData, ...data });
        observer.next();
        observer.complete();
      }, 100);
    });
  }

  deleteDocument(path: string): Observable<void> {
    return new Observable(observer => {
      setTimeout(() => {
        this.db.delete(path);
        observer.next();
        observer.complete();
      }, 100);
    });
  }

  orderByField(field: string, direction: 'asc' | 'desc' = 'desc'): any {
    return { type: 'orderBy', field, direction };
  }

  limitResults(count: number): any {
    return { type: 'limit', value: count };
  }

  whereField(field: string, operator: '==' | '!=' | '<' | '<=' | '>' | '>=', value: any): any {
    return { type: 'where', field, operator, value };
  }
}

