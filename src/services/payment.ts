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
  keyId?: string; // Alternative name for key id (used in some envs)
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
    // Use direct fetch to bypass potential library issues
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    let response;
    let data;
    let attempt = 0;
    const maxRetries = 6; // Increased to 6 (~15s total wait) to handle slow cold starts/replication

    while (attempt < maxRetries) {
      try {
        response = await fetch(`${supabaseUrl}/functions/v1/initiate-payment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${anonKey}`,
          },
          body: JSON.stringify(payload),
        });

        data = await response.json();

        if (response.ok) {
           break; // Success!
        }
        
        // If 404 (Order not found), wait and retry (DB sync delay)
        if (response.status === 404) {
           console.warn(`Attempt ${attempt+1}/${maxRetries}: Order not found yet. Retrying in 2.5s...`);
           await new Promise(r => setTimeout(r, 2500)); 
           attempt++;
           continue;
        }

        // Other errors, throw immediately
        throw new Error(data.error || `Server returned ${response.status}`);
      } catch (err) {
         if (attempt === maxRetries - 1) throw err;
         console.warn(`Payment init retry ${attempt+1} failed:`, err);
         await new Promise(r => setTimeout(r, 1000));
         attempt++;
      }
    }

    if (!response || !response.ok) {
       console.error("Direct fetch failed after retries:", data);
       throw new Error(data?.error || "Payment initialization failed");
    }

    // Return the safe response from the Edge Function
    return data as PaymentInitiationResponse;
  } catch (e) {
    console.error("Payment initiation exception:", e);
    return {
      success: false,
      paymentStatus: "INITIATED",
      orderId: payload.orderId,
      orderNumber: payload.orderNumber,
      error: "Network error occurred. Please check your connection.",
    };
  }
};

/**
 * Verify payment signature on the server.
 * This is the critical step to ensure the payment is genuine and update the DB instantly.
 */
export const verifyPayment = async (
  razorpay_payment_id: string,
  razorpay_order_id: string,
  razorpay_signature: string,
  orderId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/verify-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${anonKey}`,
        "apikey": anonKey,
      },
      body: JSON.stringify({
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        orderId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Verification failed from server:", {
        status: response.status,
        statusText: response.statusText,
        error: data
      });
      return { success: false, error: data.error || `Server Error: ${response.status} ${response.statusText}` };
    }

    return { success: true };
  } catch (e) {
    console.error("verifyPayment Exception:", e);
    return { success: false, error: "Network/CORS error or Server Unreachable" };
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
