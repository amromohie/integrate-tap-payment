import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    CardSDK?: {
      renderTapCard: (
        elementId: string,
        config: any
      ) => {
        unmount: () => void;
      };
      tokenize: () => void;
      Currencies: any;
      Locale: any;
      Theme: any;
      Edges: any;
      Direction: any;
    };
  }
}

export interface TapCardConfig {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  onValidInput?: (isValid: boolean) => void;
  onInvalidInput?: (errors: any) => void;
  onReady?: () => void;
  onFocus?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class TapPaymentService {
  private tapCardInstance: { unmount: () => void } | null = null;

  /**
   * Initialize Tap SDK card container
   * @param elementId ID of the container element
   * @param config Configuration callbacks
   * @returns Unmount function
   */
  initializeCard(elementId: string, config: TapCardConfig): { unmount: () => void } | null {
    if (!window.CardSDK) {
      console.error('Tap SDK not loaded. Make sure the script is included in index.html');
      return null;
    }

    const { renderTapCard, Currencies, Locale, Theme, Edges, Direction } = window.CardSDK;
    const publishableKey = environment.tapPayments.publishableKey;

    if (!publishableKey) {
      console.error('Tap Payments publishable key not configured');
      return null;
    }

    try {
      this.tapCardInstance = renderTapCard(elementId, {
        publicKey: publishableKey,
        merchant: {
          id: '' // Empty for tokenization only
        },
        transaction: {
          amount: 1, // Minimum amount for tokenization
          currency: Currencies.SAR
        },
        customer: {
          id: '',
          name: [
            {
              lang: Locale.EN,
              first: '',
              last: ''
            }
          ],
          nameOnCard: '',
          editable: true,
          contact: {
            email: '',
            phone: {
              countryCode: '',
              number: ''
            }
          }
        },
        acceptance: {
          supportedBrands: ['AMERICAN_EXPRESS', 'VISA', 'MASTERCARD', 'MADA'],
          supportedCards: 'ALL'
        },
        fields: {
          cardHolder: true // SDK handles cardholder name input
        },
        addons: {
          displayPaymentBrands: true,
          loader: true,
          saveCard: false // We handle saving to Firestore ourselves
        },
        interface: {
          locale: Locale.EN,
          theme: Theme.LIGHT,
          edges: Edges.CURVED,
          direction: Direction.LTR
        },
        onReady: config.onReady,
        onFocus: config.onFocus,
        onValidInput: config.onValidInput,
        onInvalidInput: config.onInvalidInput,
        onError: config.onError,
        onSuccess: config.onSuccess
      });

      return this.tapCardInstance;
    } catch (error) {
      console.error('Failed to initialize Tap SDK:', error);
      return null;
    }
  }

  /**
   * Trigger tokenization
   * This will cause the onSuccess callback to fire with the token
   */
  tokenize(): void {
    if (!window.CardSDK || typeof window.CardSDK.tokenize !== 'function') {
      console.error('Tap SDK tokenize method not available');
      return;
    }
    window.CardSDK.tokenize();
  }

  /**
   * Unmount and cleanup the Tap SDK instance
   */
  unmount(): void {
    if (this.tapCardInstance) {
      this.tapCardInstance.unmount();
      this.tapCardInstance = null;
    }
  }

  /**
   * Check if Tap SDK is loaded
   */
  isSDKLoaded(): boolean {
    return typeof window.CardSDK !== 'undefined';
  }
}
