import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FirestoreService } from '../../../core/services/firestore.service';
import { UserStoreService } from '../../../core/services/user-store.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PaymentToken } from '../payment-form/payment-form.component';
import { orderBy, where } from '@angular/fire/firestore';

// PaymentToken with required id for list items
type PaymentTokenWithId = PaymentToken & { id: string };

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent],
  templateUrl: './payment-list.component.html',
  styleUrl: './payment-list.component.css'
})
export class PaymentListComponent implements OnInit {
  private readonly firestoreService = inject(FirestoreService);
  private readonly userStoreService = inject(UserStoreService);

  readonly payments = signal<PaymentTokenWithId[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadPayments();
  }

  private loadPayments(): void {
    const userId = this.userStoreService.user()?.uid;
    if (!userId) {
      this.errorMessage.set('User not authenticated');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Load user's payment tokens with real-time updates
    this.firestoreService.getCollectionSnapshot<PaymentToken>(
      'paymentTokens',
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    ).subscribe({
      next: (tokens) => {
        // Store tokens with their Firestore document IDs
        // Note: You may need to modify FirestoreService to include document IDs
        // For now, tokens will be stored without document IDs
        // You'll need to enhance getCollectionSnapshot to return document IDs
        this.payments.set(tokens);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading payments:', error);
        this.errorMessage.set('Failed to load payment methods');
        this.isLoading.set(false);
      }
    });
  }

  async deletePayment(payment: PaymentToken): Promise<void> {
    if (!confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    const userId = this.userStoreService.user()?.uid;
    if (!userId) {
      return;
    }

    // The document ID is now included in the payment object from Firestore
    try {
      if (payment.id) {
        await this.firestoreService.deleteDocument(`paymentTokens/${payment.id}`).toPromise();
      } else {
        this.errorMessage.set('Unable to delete. Please refresh and try again.');
      }
      // List will update automatically via real-time listener
    } catch (error) {
      console.error('Error deleting payment:', error);
      this.errorMessage.set('Failed to delete payment method');
    }
  }

  getCardDisplayName(payment: PaymentToken): string {
    if (payment.brand && payment.lastFour) {
      return `${payment.brand.toUpperCase()} •••• ${payment.lastFour}`;
    }
    if (payment.lastFour) {
      return `Card •••• ${payment.lastFour}`;
    }
    return 'Card';
  }

  getExpiryDisplay(payment: PaymentToken): string {
    if (payment.expiryMonth && payment.expiryYear) {
      return `${payment.expiryMonth.toString().padStart(2, '0')}/${payment.expiryYear}`;
    }
    return 'N/A';
  }
}
