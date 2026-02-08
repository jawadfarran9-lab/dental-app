// Phase V: Subscription Plan Types

export type SubscriptionPlan = 'MONTHLY' | 'YEARLY';

export interface SubscriptionPricing {
  monthly: number;
  yearly: number;
  yearlyMonthlyEquivalent: number;
  savingsPercent: number;
  savingsAmount: number;
    aiPro: number; // $9.99/month add-on
    aiProYearly: number; // $119.88/year add-on (9.99 × 12)
}

// Pricing constants
export const SUBSCRIPTION_PRICING: SubscriptionPricing = {
  monthly: 19.99,
  yearly: 230.88,
  yearlyMonthlyEquivalent: 19.24, // 230.88/12 = 19.24
  savingsPercent: 4, // (19.99-19.24)/19.99 * 100
  savingsAmount: 9.00, // (19.99*12) - 230.88 = 239.88 - 230.88 = 9.00
  aiPro: 9.99, // AI Pro monthly add-on
  aiProYearly: 119.88, // AI Pro annual add-on (9.99 × 12)
};

// Old pricing for strikethrough display
export const SUBSCRIPTION_PRICING_OLD = {
  monthly: 29.99,
  yearly: 239.88,
  monthlyWithAIPro: 29.98,
  yearlyWithAIPro: 359.76,
};

export interface SubscriptionSelection {
  plan: SubscriptionPlan;
  price: number;
  displayPrice: string;
  includeAIPro?: boolean;
}
