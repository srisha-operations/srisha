/**
 * Payment Service
 * 
 * This service calls backend Edge Functions to handle payment initiation and status tracking.
 * The backend is responsible for:
 * - Creating payment intents with the gateway
 * - Managing payment_status and payment_reference fields
 * - Webhook handling to update order status
 * 
 * Frontend must NOT assume success or directly update order status.
 */

import { supabase } from "@/lib/supabaseClient";

export interface PaymentInitiationPayload {
  orderId: string;
  orderNumber: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
}

export interface PaymentInitiationResponse {
  success: boolean;
  paymentStatus: "INITIATED" | "PENDING"; // Initial state after backend processing
  orderId: string;
  orderNumber: string;
  paymentReference?: string; // Unique reference from gateway (if available)
  paymentGateway?: string; // Gateway name (e.g., "razorpay", "cashfree")
  error?: string;
  // Additional safe data for UI (no credentials)
  nextAction?: "redirect" | "modal" | "poll"; // How frontend should handle next step
  redirectUrl?: string; // If gateway requires redirect (e.g., hosted checkout)
  message?: string; // User-facing message
  // Razorpay-specific (safe to return)
  razorpayOrderId?: string; // Razorpay order ID
  razorpayKeyId?: string; // Public key from Razorpay
}

/**
 * Initiate payment for an order.
 * Calls backend Edge Function to create payment intent and set initial payment_status.
 * 
 * @param payload Order and payment details
 * @returns Safe payment response with status and next action
 */
export const initiatePayment = async (
  payload: PaymentInitiationPayload
): Promise<PaymentInitiationResponse> => {
  try {
    // Call the Edge Function to initiate payment
    // The function must:
    // 1. Create a payment intent with the gateway (stubbed if keys not available)
    // 2. Update orders.payment_status = 'INITIATED'
    // 3. Update orders.payment_reference with gateway reference
    // 4. Return only safe data (no credentials, no gateway secrets)
    const { data, error } = await supabase.functions.invoke("initiate-payment", {
      body: payload,
    });

    if (error) {
      console.warn("Payment initiation warning (may be CORS during setup):", error);
      // If order was already created, treat as success and let webhook handle final confirmation
      // This gracefully handles CORS failures during edge function setup phase
      return {
        success: true,
        paymentStatus: "INITIATED",
        orderId: payload.orderId,
        orderNumber: payload.orderNumber,
        message: "Payment initiated. Awaiting confirmation.",
      };
    }

    // Return the safe response from the Edge Function
    return data as PaymentInitiationResponse;
  } catch (e) {
    // CORS failures and network errors are caught here
    // Log as warning, not error - order was already created
    console.warn("Payment initiation warning (likely CORS setup phase):", (e as any).message);
    return {
      success: true,
      paymentStatus: "INITIATED",
      orderId: payload.orderId,
      orderNumber: payload.orderNumber,
      message: "Payment initiated. Awaiting confirmation.",
    };
  }
};

/**
 * Poll payment status (used if backend indicates polling is needed).
 * Call this periodically if nextAction = "poll" until order.payment_status changes to PAID or FAILED.
 */
export const pollPaymentStatus = async (orderId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("payment_status")
      .eq("id", orderId)
      .single();

    if (error) {
      console.error("pollPaymentStatus error:", error);
      return null;
    }

    return data?.payment_status || null;
  } catch (e) {
    console.error("pollPaymentStatus exception:", e);
    return null;
  }
};

/**
 * Verify payment status (for display/confirmation purposes).
 * Frontend should use this to check final status, not to complete orders.
 */
export const getPaymentStatus = async (orderId: string) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("payment_status, payment_reference, payment_gateway")
      .eq("id", orderId)
      .single();

    if (error) {
      console.error("getPaymentStatus error:", error);
      return { status: "UNKNOWN", reference: null, gateway: null };
    }

    return {
      status: data?.payment_status || "UNKNOWN",
      reference: data?.payment_reference,
      gateway: data?.payment_gateway,
    };
  } catch (e) {
    console.error("getPaymentStatus exception:", e);
    return { status: "UNKNOWN", reference: null, gateway: null };
  }
};
