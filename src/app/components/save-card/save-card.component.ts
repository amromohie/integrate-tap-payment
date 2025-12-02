import {
  Component,
  OnDestroy,
  AfterViewInit,
  inject,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CardService } from '../../services/card.service';
import { SaveCardRequest } from '../../interfaces/card.interface';

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

@Component({
  selector: 'app-save-card',
  imports: [],
  templateUrl: './save-card.component.html',
  styleUrl: './save-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SaveCardComponent implements AfterViewInit, OnDestroy {
  private readonly cardService = inject(CardService);

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly isCardValid = signal<boolean>(false);

  readonly capturedTokenId = signal<string>('');
  readonly capturedLastFour = signal<string>('');
  readonly capturedExpiryMonth = signal<number | null>(null);
  readonly capturedExpiryYear = signal<number | null>(null);
  readonly capturedCardholderName = signal<string>('');
  readonly capturedBrand = signal<string>('');

  private tapCardInstance: { unmount: () => void } | null = null;
  private readonly publishableKey = 'pk_test_UELxO3TYtsAFVMyzwQWcjr7G';

  ngAfterViewInit(): void {
    // Wait for SDK to be available after view init
    if (typeof window !== 'undefined' && window.CardSDK) {
      this.initializeTapSDK();
    } else {
      // Poll for SDK availability
      const checkSDK = setInterval(() => {
        if (window.CardSDK) {
          clearInterval(checkSDK);
          this.initializeTapSDK();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkSDK);
        if (!window.CardSDK) {
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


  private updateCardDataFromResponse(data: any): void {
    if (!data) return;

    const tokenId = data.id || data.token?.id || data.token;
    const lastFour = data.card?.last_four || data.payment?.card_data?.last_four || data.last_four || '';
    const expiryMonth = data.card?.exp_month || data.payment?.card_data?.exp_month || data.exp_month || null;
    const expiryYear = data.card?.exp_year || data.payment?.card_data?.exp_year || data.exp_year || null;
    const cardholderName = data.card?.name || data.customer?.nameOnCard || data.customer?.name_on_card || '';
    const brand = data.card?.brand || data.card?.scheme || '';

    if (tokenId) this.capturedTokenId.set(tokenId);
    if (lastFour) this.capturedLastFour.set(lastFour);
    if (expiryMonth !== null && expiryMonth !== undefined) this.capturedExpiryMonth.set(expiryMonth);
    if (expiryYear !== null && expiryYear !== undefined) this.capturedExpiryYear.set(expiryYear);
    if (cardholderName) this.capturedCardholderName.set(cardholderName);
    if (brand) this.capturedBrand.set(brand);

    this.isCardValid.set(!!tokenId);
  }


  private initializeTapSDK(): void {
    const cardContainer = document.getElementById('tap-card-container');
    if (!cardContainer || !window.CardSDK) {
      return;
    }

    const { renderTapCard, Currencies, Locale, Theme, Edges, Direction } = window.CardSDK;

    try {
      this.tapCardInstance = renderTapCard('tap-card-container', {
        publicKey: this.publishableKey,
        merchant: {
          id: '' // Empty for card capture only
        },
        transaction: {
          amount: 1,
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
          cardHolder: true // Let Tap SDK handle cardholder field
        },
        addons: {
          displayPaymentBrands: true,
          loader: true,
          saveCard: false // We handle saving ourselves
        },
        // Add a custom submit button configuration if Tap SDK supports it
        // This might help trigger onSuccess callback
        interface: {
          locale: Locale.EN,
          theme: Theme.LIGHT,
          edges: Edges.CURVED,
          direction: Direction.LTR
        },
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
        onInvalidInput: (data: any) => {
          this.isCardValid.set(false);
          if (data?.errors?.length > 0) {
            this.errorMessage.set(data.errors.map((e: any) => e.message).join(', '));
          }
        },
        onError: (error: any) => {
          console.error('Tap SDK Error:', error);
          this.errorMessage.set(error.message || 'An error occurred with the card input');
          this.isCardValid.set(false);
        },
        onSuccess: (data: any) => {

          console.log('on success');

          console.log(data);


          if (!data) {
            this.errorMessage.set('Token received but no data provided.');
            return;
          }

          const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
          this.updateCardDataFromResponse(parsedData);

          console.log('parsed data: ', parsedData);


          const tokenId = this.capturedTokenId();
          if (tokenId) {
            this.saveCardToken(
              tokenId,
              this.capturedLastFour(),
              this.capturedExpiryMonth(),
              this.capturedExpiryYear(),
              this.capturedCardholderName(),
              this.capturedBrand()
            );
          } else {
            this.isLoading.set(false);
            this.errorMessage.set('Token received but token ID is missing.');
          }
        }
      });
    } catch (error) {
      console.error('Failed to initialize Tap SDK:', error);
      this.errorMessage.set('Failed to initialize card input. Please refresh the page.');
    }
  }



  private saveCardToken(
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

    const cardData: SaveCardRequest = {
      tokenId,
      lastFour: lastFour || undefined,
      expiryMonth: expiryMonth || undefined,
      expiryYear: expiryYear || undefined,
      cardholderName: cardholderName || undefined,
      brand: brand || undefined
    };

    this.cardService.saveCard(cardData).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.successMessage.set(response.message || 'Card tokenized successfully!');
        this.resetForm();
        setTimeout(() => this.successMessage.set(null), 5000);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Failed to save card token. Please try again.');
      }
    });
  }

  private resetForm(): void {
    this.capturedTokenId.set('');
    this.capturedLastFour.set('');
    this.capturedExpiryMonth.set(null);
    this.capturedExpiryYear.set(null);
    this.capturedCardholderName.set('');
    this.capturedBrand.set('');
    this.isCardValid.set(false);
  }
}
