export interface CardData {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
}

export interface TapCardResponse {
  card: {
    number: string;
    expiryMonth: string;
    expiryYear: string;
  };
  isValid: boolean;
}

export interface TapTokenResponse {
  id: string;
  status: string;
  created: number;
  object: string;
  type: string;
  purpose: string;
  used: boolean;
  card?: {
    id: string;
    object: string;
    exp_month: number;
    exp_year: number;
    last_four: string;
    first_six?: string;
    first_eight?: string;
    name?: string;
    brand?: string;
    scheme?: string;
    category?: string;
  };
  payment?: {
    card_data?: {
      exp_month: number;
      exp_year: number;
      last_four: string;
    };
  };
}

export interface SaveCardResponse {
  success: boolean;
  message?: string;
  cardId?: string;
  tokenId?: string;
}

export interface SaveCardRequest {
  tokenId: string;
  // Optional metadata for display only (NOT saved to DB)
  lastFour?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cardholderName?: string;
  brand?: string;
}

