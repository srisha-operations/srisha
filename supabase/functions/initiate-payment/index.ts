/**
 * Supabase Edge Function: initiate-payment
 * 
 * Purpose:
 * - Create a payment intent with the configured payment gateway
 * - Update order payment_status and payment_reference in the database
 * - Return safe data to the frontend (no secrets/credentials)
 * 
 * Payment Gateway Integration:
 * - Currently stubbed (no real gateway integration)
 * - When gateway keys become available, integrate with:
 *   - Razorpay (recommended): POST to https://api.razorpay.com/v1/orders
 *   - Cashfree: POST to https://api.cashfree.com/pg/orders
 *   - Stripe: POST to https://api.stripe.com/v1/payment_intents
 * 
 * Environment Variables (set in Supabase):
 * - PAYMENT_GATEWAY: "razorpay" | "cashfree" | "stripe" (default: stubbed)
 * - RAZORPAY_KEY_ID: Your Razorpay key (optional for now)
 * - RAZORPAY_KEY_SECRET: Your Razorpay secret (optional for now)
 * - WEBHOOK_SECRET: For verifying webhook signatures (optional for now)
 * 
 * Database Schema Assumptions:
 * - orders table has: payment_status, payment_reference, payment_gateway columns
 * - orders.order_status = "PENDING" (set by frontend createOrder)
 * - orders.payment_status will be updated to "INITIATED" or "FAILED"
 * 
 * Request Payload:
 * {
 *   orderId: string;
 *   orderNumber: string;
 *   amount: number (in rupees);
 *   customerEmail: string;
 *   customerName: string;
 *   customerPhone: string;
 * }
 * 
 * Response:
 * {
 *   success: boolean;
 *   paymentStatus: "INITIATED" | "PENDING";
 *   orderId: string;
 *   orderNumber: string;
 *   paymentReference?: string;
 *   paymentGateway?: string;
 *   nextAction?: "redirect" | "modal" | "poll";
 *   redirectUrl?: string;
 *   message?: string;
 *   error?: string;
 * }
 * 
 * Workflow:
 * 1. Receive order details from frontend
 * 2. Validate input and fetch order from database
 * 3. Create payment intent with gateway (or stub)
 * 4. Update order.payment_status = "INITIATED" and store payment_reference
 * 5. Return safe response with next action (redirect/modal/poll)
 * 6. Frontend handles response (may redirect to gateway, open modal, or poll for webhook)
 * 
 * Security Notes:
 * - Never return gateway secrets or API keys to frontend
 * - Validate orderId ownership (optional: check auth context)
 * - Use HTTPS only; Supabase Edge Functions are HTTPS by default
 * - Signature verification for webhooks must happen server-side
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body
    const {
      orderId,
      orderNumber,
      amount,
      customerEmail,
      customerName,
      customerPhone,
    } = await req.json();

    // Validate required fields
    if (!orderId || !orderNumber || !amount || !customerEmail || !customerName) {
      return new Response(
        JSON.stringify({
          success: false,
          paymentStatus: "PENDING",
          error: "Missing required fields: orderId, orderNumber, amount, customerEmail, customerName",
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Fetch the order to verify it exists
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, payment_status, total_amount")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order fetch error:", orderError);
      return new Response(
        JSON.stringify({
          success: false,
          paymentStatus: "PENDING",
          orderId,
          orderNumber,
          error: "Order not found",
        }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify order status is PENDING (from frontend createOrder)
    if (order.order_status !== "PENDING") {
      return new Response(
        JSON.stringify({
          success: false,
          paymentStatus: order.payment_status || "UNKNOWN",
          orderId,
          orderNumber,
          error: `Order status is ${order.order_status}, expected PENDING`,
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // TODO: Integrate with real payment gateway
    // For now, this is a stub. When gateway keys are available:
    // 1. Call the gateway API to create a payment intent
    // 2. Receive back a reference/id/key from the gateway
    // 3. Determine next action (redirect, modal, etc.)
    //
    // Example for Razorpay:
    // const gatewayResponse = await fetch("https://api.razorpay.com/v1/orders", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     "Authorization": "Basic " + btoa(RAZORPAY_KEY_ID + ":" + RAZORPAY_KEY_SECRET),
    //   },
    //   body: JSON.stringify({
    //     amount: amount * 100, // Razorpay expects paise
    //     currency: "INR",
    //     receipt: orderNumber,
    //     notes: {
    //       customer_name: customerName,
    //       customer_email: customerEmail,
    //       customer_phone: customerPhone,
    //     },
    //   }),
    // });

    // Stub implementation: generate a reference and mark as INITIATED
    const paymentReference = `stub-${orderId}-${Date.now()}`;
    const paymentGateway = "stubbed";

    // Update order with payment information
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: "INITIATED",
        payment_reference: paymentReference,
        payment_gateway: paymentGateway,
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Order update error:", updateError);
      return new Response(
        JSON.stringify({
          success: false,
          paymentStatus: "PENDING",
          orderId,
          orderNumber,
          error: "Failed to initiate payment",
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Return safe response (no secrets)
    return new Response(
      JSON.stringify({
        success: true,
        paymentStatus: "INITIATED",
        orderId,
        orderNumber,
        paymentReference,
        paymentGateway,
        nextAction: "poll", // Frontend should poll for webhook updates
        message: "Payment initiated. Waiting for confirmation...",
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("initiate-payment error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        paymentStatus: "PENDING",
        error: "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
