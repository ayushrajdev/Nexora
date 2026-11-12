import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/config/routes";
import {
  ApiResponse,
  CreatePaymentOrderResponse,
  PaidMembershipTier,
  PremiumVerificationResponse,
  RazorpayOrderDetails,
  RazorpayOrderNotes,
} from "@/types";

interface RawOrderResponse {
  order?: RazorpayOrderDetails;
  orderId?: string;
  amount?: number;
  currency?: string;
  keyId: string;
  notes?: RazorpayOrderNotes;
}

/**
 * Dynamically loads the Razorpay Checkout SDK script if not already loaded.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if ("Razorpay" in window) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export const paymentService = {
  /**
   * Creates a Razorpay order and normalizes both nested (`{ order, keyId }`)
   * and flat (`{ orderId, amount, currency, keyId, notes }`) response shapes.
   */
  async createOrder(
    membershipType: PaidMembershipTier
  ): Promise<CreatePaymentOrderResponse> {
    const response = await apiClient.post<ApiResponse<RawOrderResponse>>(
      API_ENDPOINTS.PAYMENT.CREATE_ORDER,
      { membershipType }
    );
    const raw = response.data.data;
    if (!raw) {
      throw new Error("Invalid payment order response");
    }

    const orderId = raw.orderId || raw.order?.id || "";
    const amount = raw.amount ?? raw.order?.amount ?? 0;
    const currency = raw.currency || raw.order?.currency || "INR";
    const notes = raw.notes ||
      raw.order?.notes || {
        firstName: "",
        lastName: "",
        membershipType,
      };

    return {
      orderId,
      amount,
      currency,
      keyId: raw.keyId,
      notes,
    };
  },

  async verifyPremium(): Promise<PremiumVerificationResponse> {
    const response = await apiClient.get<
      ApiResponse<PremiumVerificationResponse>
    >(API_ENDPOINTS.PAYMENT.VERIFY_PREMIUM);
    return (
      response.data.data ?? {
        isPremium: false,
        membershipType: null,
      }
    );
  },
};
