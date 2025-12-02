import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SaveCardRequest, SaveCardResponse } from '../interfaces/card.interface';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/cards'; // Placeholder endpoint - update this with your actual backend URL

  /**
   * Saves card token to backend.
   * Note: Only token ID is saved to DB. Card details (lastFour, expiry, etc.) 
   * are optional metadata for display/confirmation and should NOT be stored in database.
   */
  saveCard(cardData: SaveCardRequest): Observable<SaveCardResponse> {
    return this.http.post<SaveCardResponse>(this.apiUrl, cardData).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}

