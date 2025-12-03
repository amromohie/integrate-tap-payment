import { Observable, from, map } from 'rxjs';
import {
  Firestore,
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  DocumentData,
  QueryConstraint,
  Timestamp,
  QuerySnapshot,
  DocumentSnapshot
} from '@angular/fire/firestore';

/**
 * Adapter to use Firebase Firestore
 */
export class FirebaseFirestoreAdapter {
  constructor(private firestore: Firestore) {}

  getDocument<T = DocumentData>(path: string): Observable<T | null> {
    const docRef = doc(this.firestore, path);
    return from(getDoc(docRef)).pipe(
      map((docSnap: DocumentSnapshot<DocumentData>) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          return this.convertTimestamps(data) as T;
        }
        return null;
      })
    );
  }

  getCollection<T = DocumentData>(
    path: string,
    ...queryConstraints: QueryConstraint[]
  ): Observable<T[]> {
    const collectionRef = collection(this.firestore, path);
    const q = queryConstraints.length > 0
      ? query(collectionRef, ...queryConstraints)
      : collectionRef;

    return from(getDocs(q)).pipe(
      map((querySnapshot: QuerySnapshot<DocumentData>) => {
        return querySnapshot.docs.map((docSnap: DocumentSnapshot<DocumentData>) => {
          const data = docSnap.data();
          return this.convertTimestamps(data) as T;
        });
      })
    );
  }

  getCollectionSnapshot<T = DocumentData>(
    path: string,
    ...queryConstraints: QueryConstraint[]
  ): Observable<(T & { id: string })[]> {
    return new Observable(observer => {
      const collectionRef = collection(this.firestore, path);
      const q = queryConstraints.length > 0
        ? query(collectionRef, ...queryConstraints)
        : collectionRef;

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot: QuerySnapshot<DocumentData>) => {
          const data = querySnapshot.docs.map((docSnap: DocumentSnapshot<DocumentData>) => {
            const docData = docSnap.data();
            return {
              ...this.convertTimestamps(docData),
              id: docSnap.id
            } as T & { id: string };
          });
          observer.next(data);
        },
        (error: Error) => {
          observer.error(error);
        }
      );

      return unsubscribe;
    });
  }

  setDocument<T = DocumentData>(path: string, data: Partial<T>): Observable<void> {
    const docRef = doc(this.firestore, path);
    const firestoreData = this.convertDatesToTimestamps(data);
    return from(setDoc(docRef, firestoreData));
  }

  updateDocument<T = DocumentData>(path: string, data: Partial<T>): Observable<void> {
    const docRef = doc(this.firestore, path);
    const firestoreData = this.convertDatesToTimestamps(data);
    return from(updateDoc(docRef, firestoreData));
  }

  deleteDocument(path: string): Observable<void> {
    const docRef = doc(this.firestore, path);
    return from(deleteDoc(docRef));
  }

  orderByField(field: string, direction: 'asc' | 'desc' = 'desc'): QueryConstraint {
    return orderBy(field, direction) as any;
  }

  limitResults(count: number): QueryConstraint {
    return limit(count) as any;
  }

  whereField(field: string, operator: '==' | '!=' | '<' | '<=' | '>' | '>=', value: any): QueryConstraint {
    return where(field, operator, value) as any;
  }

  private convertTimestamps(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (data instanceof Timestamp) {
      return data.toDate();
    }

    if (Array.isArray(data)) {
      return data.map(item => this.convertTimestamps(item));
    }

    const converted: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];
        if (value instanceof Timestamp) {
          converted[key] = value.toDate();
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          converted[key] = this.convertTimestamps(value);
        } else if (Array.isArray(value)) {
          converted[key] = value.map(item => this.convertTimestamps(item));
        } else {
          converted[key] = value;
        }
      }
    }
    return converted;
  }

  private convertDatesToTimestamps(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (data instanceof Date) {
      return Timestamp.fromDate(data);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.convertDatesToTimestamps(item));
    }

    const converted: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];
        if (value instanceof Date) {
          converted[key] = Timestamp.fromDate(value);
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          converted[key] = this.convertDatesToTimestamps(value);
        } else if (Array.isArray(value)) {
          converted[key] = value.map(item => this.convertDatesToTimestamps(item));
        } else {
          converted[key] = value;
        }
      }
    }
    return converted;
  }
}

