/**
 * Supabase Edge Function: payment-webhook
 * 
 * Purpose:
 * - Receive and verify webhook payloads from payment gateway
 * - Update order payment_status to PAID or FAILED based on webhook data
 * - Update order.order_status to CONFIRMED or CANCELLED accordingly
 * 
 * Webhook Sources:
 * - Razorpay: https://razorpay.com/docs/webhooks/
 * - Cashfree: https://docs.cashfree.com/payment-links/webhooks
 * - Stripe: https://stripe.com/docs/webhooks/
 * 
 * Environment Variables (set in Supabase):
 * - WEBHOOK_SECRET: Secret key for verifying signatures (from gateway)
 * - PAYMENT_GATEWAY: Type of gateway (razorpay, cashfree, stripe, etc.)
 * 
 * Database Schema Assumptions:
 * - orders.payment_status: Can be set to "PAID" or "FAILED"
 * - orders.order_status: Can be set to "CONFIRMED" (on PAID) or "CANCELLED" (on failure)
 * 
 * Security:
 * - Must verify webhook signature before processing
 * - Should validate payment amount matches order total
 * - Should idempotent (safe to receive same webhook multiple times)
 * 
 * Webhook Processing Flow:
 * 1. Receive webhook payload from gateway
 * 2. Verify signature using WEBHOOK_SECRET
 * 3. Extract payment_reference (order_id, charge_id, etc. depending on gateway)
 * 4. Fetch order by payment_reference
 * 5. Check payment status from webhook
 * 6. Update order.payment_status and order.status
 * 7. Return 200 OK to acknowledge receipt
 * 
 * Example Webhook Signatures:
 * 
 * Razorpay (body.razorpay_payment_id + body.razorpay_order_id + body.razorpay_signature):
 *   HMAC-SHA256(message, WEBHOOK_SECRET) == body.razorpay_signature
 * 
 * Cashfree (x-webhook-signature header):
 *   Provided directly in header
 * 
 * Stripe (stripe-signature header with t and v1 components):
 *   HMAC-SHA256(timestamp.payload, WEBHOOK_SECRET) == v1 value
 * 
 * Note: When gateway keys are available, implement actual signature verification.
 * For now, this is a stub that acknowledges webhooks.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Stub implementation: Verify webhook signature
 * When real keys are available, implement actual verification logic
 */
async function verifyWebhookSignature(
  gateway: string,
  rawBody: string,
  headers: Headers,
  secret: string
): Promise<boolean> {
  if (gateway !== "razorpay") {
    // For other gateways, we still defer implementation or assume true for now if not configured
    console.log(`Signature verification for ${gateway} not yet implemented`);
    return true; 
  }

  const signature = headers.get("x-razorpay-signature");
  if (!signature) {
    console.error("Missing x-razorpay-signature header");
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signed = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(rawBody)
    );

    const calculatedSignature = Array.from(new Uint8Array(signed))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const isValid = calculatedSignature === signature;
    if (!isValid) {
      console.error(`Signature mismatch. Calc: ${calculatedSignature}, Recv: ${signature}`);
    }
    return isValid;
  } catch (err) {
    console.error("Crypto error during signature verification:", err);
    return false;
  }
}

/**
 * Parse webhook payload and extract common fields
 */
interface WebhookData {
  paymentStatus: "PAID" | "FAILED" | "PENDING" | "UNKNOWN";
  paymentReference: string | null;
  amount?: number;
  customerEmail?: string;
}

function parseWebhookPayload(gateway: string, payload: any): WebhookData {
  // TODO: Implement parsing based on gateway type
  // For now, extract common fields
  
  switch (gateway) {
    case "razorpay":
      return {
        paymentStatus: payload.event?.includes("payment.authorized") || payload.event?.includes("order.paid")
          ? "PAID" // Razorpay "captured" or authorized usually means success for us if auto-capture is on
          : payload.event?.includes("payment.failed")
          ? "FAILED"
          : "UNKNOWN",
        paymentReference: payload.payload?.payment?.entity?.order_id || payload.payload?.order?.entity?.id,
        // Fallback: try different fields typically present in Razorpay webhooks
        // usually payload.payload.payment.entity.order_id links back to our intent
        amount: payload.payload?.payment?.entity?.amount
          ? payload.payload.payment.entity.amount / 100
          : undefined,
      };

    case "cashfree":
      return {
        paymentStatus:
          payload.data?.order?.order_status === "PAID" ? "PAID" : "FAILED",
        paymentReference: payload.data?.order?.order_id,
        amount: payload.data?.order?.order_amount,
      };

    case "stripe":
      return {
        paymentStatus:
          payload.data?.object?.status === "succeeded" ? "PAID" : "FAILED",
        paymentReference: payload.data?.object?.metadata?.order_id,
        amount: payload.data?.object?.amount ? payload.data.object.amount / 100 : undefined,
      };

    default:
      console.log(`Unknown gateway: ${gateway}`);
      return {
        paymentStatus: "UNKNOWN",
        paymentReference: null,
      };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const gateway = Deno.env.get("PAYMENT_GATEWAY") || "razorpay"; // Default to razorpay if not set
    const webhookSecret = Deno.env.get("WEBHOOK_SECRET");

    if (!webhookSecret) {
      console.error("WEBHOOK_SECRET is not set");
      return new Response(JSON.stringify({ error: "Configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Parse webhook payload
    // IMPORTANT: Read raw text first for signature verification
    const rawBody = await req.text();
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
       return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verify signature
    const isValid = await verifyWebhookSignature(
      gateway,
      rawBody,
      req.headers,
      webhookSecret
    );

    if (!isValid) {
      console.error("Webhook signature verification failed");
      return new Response(JSON.stringify({ error: "Signature verification failed" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Parse webhook data based on gateway
    const webhookData = parseWebhookPayload(gateway, payload);

    if (!webhookData.paymentReference) {
      console.warn("Webhook received but could not extract payment reference");
      // console.log("Payload:", JSON.stringify(payload)); 
      return new Response(JSON.stringify({ status: "acknowledged", warning: "no_reference" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Find order by payment_reference
    // For Razorpay, payment_reference in our DB is the razorpay_order_id (e.g. order_DaZ...)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, payment_status")
      .eq("payment_reference", webhookData.paymentReference)
      .single();

    if (orderError || !order) {
      console.warn(`Order not found for payment reference: ${webhookData.paymentReference}`);
      // Still acknowledge the webhook (idempotent)
      return new Response(JSON.stringify({ status: "acknowledged", warning: "order_not_found" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Idempotent: if order is already in final state, don't re-process
    if (order.payment_status === "PAID" || order.payment_status === "FAILED") {
      console.log(`Order ${order.order_number} already in final state: ${order.payment_status}`);
      return new Response(JSON.stringify({ status: "acknowledged" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Update order based on webhook status
    // Note: order_status only allows: PENDING | CONFIRMED | DISPATCHED | DELIVERED | CANCELLED
    // So failed payments map to CANCELLED, not FAILED status, but payment_status is FAILED
    const newOrderStatus =
      webhookData.paymentStatus === "PAID" ? "CONFIRMED" : "CANCELLED";
    
    // Only update if we have a definitive status
    if (webhookData.paymentStatus === "UNKNOWN") {
       return new Response(JSON.stringify({ status: "acknowledged", info: "unknown_status" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: webhookData.paymentStatus,
        status: newOrderStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateError) {
      console.error(`Failed to update order ${order.order_number}:`, updateError);
      return new Response(JSON.stringify({ error: "Database update failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(
      `Order ${order.order_number} updated: payment_status=${webhookData.paymentStatus}, status=${newOrderStatus}`
    );

    // Acknowledge webhook receipt
    return new Response(JSON.stringify({ status: "acknowledged" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("payment-webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
