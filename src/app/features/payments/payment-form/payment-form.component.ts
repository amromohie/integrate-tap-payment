import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TapPaymentService } from '../../../core/services/tap-payment.service';
import { FirestoreService } from '../../../core/services/firestore.service';
import { UserStoreService } from '../../../core/services/user-store.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

export interface PaymentToken {
  id?: string; // Firestore document ID (optional for new documents)
  tokenId: string;
  userId: string;
  lastFour?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cardholderName?: string;
  brand?: string;
  createdAt?: Date;
}

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.css'
})
export class PaymentFormComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly tapPaymentService = inject(TapPaymentService);
  private readonly firestoreService = inject(FirestoreService);
  private readonly userStoreService = inject(UserStoreService);
  readonly router = inject(Router); // Public for template access

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly isCardValid = signal<boolean>(false);

  private tapCardInstance: { unmount: () => void } | null = null;
  private readonly containerId = 'tap-payment-container';

  ngOnInit(): void {
    // Ensure user is authenticated
    if (!this.userStoreService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
    }
  }

  ngAfterViewInit(): void {
    // Wait for SDK to be available
    if (this.tapPaymentService.isSDKLoaded()) {
      this.initializeTapCard();
    } else {
      // Poll for SDK availability
      const checkSDK = setInterval(() => {
        if (this.tapPaymentService.isSDKLoaded()) {
          clearInterval(checkSDK);
          this.initializeTapCard();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkSDK);
        if (!this.tapPaymentService.isSDKLoaded()) {
          this.errorMessage.set('Failed to load Tap SDK. Please refresh the page.');
        }
      }, 10000);
    }
  }

  ngOnDestroy(): void {
    if (this.tapCardInstance) {
      this.tapCardInstance.unmount();
      this.tapCardInstance = null;
    }
  }

  private initializeTapCard(): void {
    const container = document.getElementById(this.containerId);
    if (!container) {
      this.errorMessage.set('Payment form container not found');
      return;
    }

    this.tapCardInstance = this.tapPaymentService.initializeCard(this.containerId, {
      onReady: () => {
        console.log('Tap Card SDK is ready');
      },
      onFocus: () => {
        this.errorMessage.set(null);
      },
      onValidInput: (isValid: boolean) => {
        this.isCardValid.set(isValid);
        this.errorMessage.set(null);
      },
      onInvalidInput: (errors: any) => {
        this.isCardValid.set(false);
        if (errors?.errors?.length > 0) {
          this.errorMessage.set(errors.errors.map((e: any) => e.message).join(', '));
        }
      },
      onError: (error: any) => {
        console.error('Tap SDK Error:', error);
        this.errorMessage.set(error.message || 'An error occurred with the card input');
        this.isCardValid.set(false);
        this.isLoading.set(false);
      },
      onSuccess: (data: any) => {
        this.handleTokenSuccess(data);
      }
    });
  }

  private handleTokenSuccess(data: any): void {
    if (!data) {
      this.errorMessage.set('Token received but no data provided.');
      return;
    }

    try {
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      const tokenId = parsedData.id || parsedData.token?.id || parsedData.token;

      if (!tokenId) {
        this.errorMessage.set('Token received but token ID is missing.');
        return;
      }

      // Extract card metadata (non-sensitive)
      const lastFour = parsedData.card?.last_four || parsedData.payment?.card_data?.last_four || '';
      const expiryMonth = parsedData.card?.exp_month || parsedData.payment?.card_data?.exp_month || null;
      const expiryYear = parsedData.card?.exp_year || parsedData.payment?.card_data?.exp_year || null;
      const cardholderName = parsedData.card?.name || '';
      const brand = parsedData.card?.brand || parsedData.card?.scheme || '';

      // Save token to Firestore
      this.savePaymentToken(tokenId, lastFour, expiryMonth, expiryYear, cardholderName, brand);
    } catch (error) {
      console.error('Error parsing token response:', error);
      this.errorMessage.set('Failed to process token response.');
      this.isLoading.set(false);
    }
  }

  private savePaymentToken(
    tokenId: string,
    lastFour: string,
    expiryMonth: number | null,
    expiryYear: number | null,
    cardholderName: string,
    brand: string
  ): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const userId = this.userStoreService.user()?.uid;
    if (!userId) {
      this.errorMessage.set('User not authenticated');
      this.isLoading.set(false);
      return;
    }

    const paymentToken: PaymentToken = {
      tokenId,
      userId,
      lastFour: lastFour || undefined,
      expiryMonth: expiryMonth || undefined,
      expiryYear: expiryYear || undefined,
      cardholderName: cardholderName || undefined,
      brand: brand || undefined,
      createdAt: new Date()
    };

    // Save to Firestore in user-scoped collection
    this.firestoreService.setDocument(`paymentTokens/${Date.now()}-${userId}`, paymentToken).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Card tokenized and saved successfully!');

        // Redirect to payment list after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/payments']);
        }, 2000);
      },
      error: (error) => {
        console.error('Error saving payment token:', error);
        this.isLoading.set(false);
        this.errorMessage.set('Failed to save payment token. Please try again.');
      }
    });
  }

  onTokenize(): void {
    // if (!this.isCardValid()) {
    //   this.errorMessage.set('Please complete all card details');
    //   return;
    // }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      this.tapPaymentService.tokenize();
      // onSuccess callback will handle the response
      // Set timeout in case callback doesn't fire
      setTimeout(() => {
        if (this.isLoading()) {
          this.isLoading.set(false);
          this.errorMessage.set('Tokenization is processing. Please wait...');
        }
      }, 5000);
    } catch (error) {
      console.error('Failed to tokenize:', error);
      this.isLoading.set(false);
      this.errorMessage.set('Failed to tokenize card. Please try again.');
    }
  }
}
