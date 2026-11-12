export type PaidMembershipTier = "silver" | "gold";

export interface RazorpayOrderNotes {
  firstName: string;
  lastName: string;
  membershipType: PaidMembershipTier;
}

export interface RazorpayOrderDetails {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  status?: string;
  notes: RazorpayOrderNotes;
}

/**
 * Normalized order response supporting both the nested `{ order, keyId }`
 * from paymentService and flat `{ orderId, amount, currency, keyId, notes }`
 * documented in the API reference.
 */
export interface CreatePaymentOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  notes: RazorpayOrderNotes;
}

export interface PremiumVerificationResponse {
  isPremium: boolean;
  membershipType: PaidMembershipTier | null;
}

export interface MembershipPlan {
  id: PaidMembershipTier;
  name: string;
  priceInr: number;
  tagline: string;
  badgeColor: string;
  popular?: boolean;
  features: string[];
}
