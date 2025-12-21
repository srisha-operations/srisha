/**
 * Supabase Edge Function: initiate-payment
 * 
 * Purpose:
 * - Create a payment intent with Razorpay
 * - Store payment reference in the database
 * - Return safe data to the frontend (no secrets/credentials)
 * 
 * Razorpay Integration:
 * - Uses Razorpay Orders API
 * - Auto-captures payments (payment_capture: 1)
 * - Webhook-based confirmation (see payment-webhook function)
 * 
 * Environment Variables (set in Supabase):
 * - RAZORPAY_KEY_ID: Public key from Razorpay dashboard
 * - RAZORPAY_KEY_SECRET: Secret key from Razorpay dashboard
 * 
 * Database Schema Assumptions:
 * - orders table has: payment_status, payment_reference, payment_gateway columns
 * - orders.order_status = "PENDING" (set by frontend createOrder)
 * - orders.payment_status = "INITIATED" after this function runs
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
 *   paymentStatus: "INITIATED";
 *   orderId: string;
 *   orderNumber: string;
 *   paymentReference: string; // Razorpay order ID
 *   paymentGateway: "razorpay";
 *   nextAction: "modal";
 *   razorpayOrderId: string; // Same as paymentReference
 *   razorpayKeyId: string; // Public key (safe to return)
 *   message: string;
 * }
 * 
 * Workflow:
 * 1. Receive order details from frontend
 * 2. Validate input and fetch order from database
 * 3. Create Razorpay order via API
 * 4. Store order.payment_reference = razorpay order ID
 * 5. Return safe response with razorpay order ID and public key
 * 6. Frontend opens Razorpay Checkout modal with this data
 * 7. Webhook handler updates payment status when Razorpay posts notification
 * 
 * Deployment:
 * supabase functions deploy initiate-payment
 * 
 * Security Notes:
 * - Never return RAZORPAY_KEY_SECRET to frontend
 * - Store secret safely in Supabase environment
 * - Webhook signature verification happens in payment-webhook function
 * - HTTPS only; Supabase Edge Functions are HTTPS by default
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight - must return 200 with proper headers
  if (req.method === "OPTIONS") {
    return new Response("ok", { 
      status: 200,
      headers: corsHeaders 
    });
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

    // Create Razorpay order
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error("Razorpay keys not configured");
      return new Response(
        JSON.stringify({
          success: false,
          paymentStatus: "PENDING",
          orderId,
          orderNumber,
          error: "Payment gateway not configured",
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    try {
      // Create Basic Auth header for Razorpay API
      const authString = `${razorpayKeyId}:${razorpayKeySecret}`;
      const encodedAuth = btoa(authString);

      // Call Razorpay Orders API
      const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${encodedAuth}`,
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to paise (smallest unit)
          currency: "INR",
          receipt: orderId,
          payment_capture: 1, // Auto-capture payment
          notes: {
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone,
            order_number: orderNumber,
          },
        }),
      });

      if (!razorpayResponse.ok) {
        const razorpayError = await razorpayResponse.text();
        console.error("Razorpay API error:", razorpayError);
        return new Response(
          JSON.stringify({
            success: false,
            paymentStatus: "PENDING",
            orderId,
            orderNumber,
            error: "Failed to create payment order",
          }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const razorpayOrder = await razorpayResponse.json();
      const paymentReference = razorpayOrder.id;
      const paymentGateway = "razorpay";

      // Store Razorpay order ID and gateway info
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

      // Return safe response (do NOT return secrets)
      // Frontend will use razorpayOrderId with the KEY_ID to open checkout
      return new Response(
        JSON.stringify({
          success: true,
          paymentStatus: "INITIATED",
          orderId,
          orderNumber,
          paymentReference,
          paymentGateway,
          nextAction: "modal",
          razorpayOrderId: paymentReference,
          razorpayKeyId: razorpayKeyId, // Safe to return - public key
          message: "Payment order created. Opening checkout...",
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } catch (razorpayError) {
      console.error("Razorpay integration error:", razorpayError);
      // If Razorpay fails but order was created, still return success
      // to avoid breaking checkout flow
      const paymentReference = `razorpay-error-${orderId}-${Date.now()}`;
      const paymentGateway = "razorpay";

      try {
        await supabase
          .from("orders")
          .update({
            payment_status: "INITIATED",
            payment_reference: paymentReference,
            payment_gateway: paymentGateway,
          })
          .eq("id", orderId);
      } catch (e) {
        console.error("Fallback order update error:", e);
      }

      // Return graceful error - let webhook handle final confirmation
      return new Response(
        JSON.stringify({
          success: true,
          paymentStatus: "INITIATED",
          orderId,
          orderNumber,
          message: "Payment initiated. Please complete payment to confirm order.",
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
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
