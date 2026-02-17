// Phase W.1: Payment types placeholders

export type PaymentMethod = 'PAYPAL' | 'CARD' | 'BANK';

export interface PaymentPlanOption {
  plan: 'MONTHLY' | 'ANNUAL';
  amount: number;
  currency: 'USD';
}

export interface PaymentDraft {
  plan: 'MONTHLY' | 'ANNUAL';
  method: PaymentMethod;
  amount: number;
  currency: 'USD';
  note?: string; // placeholder note, no sensitive data
}
