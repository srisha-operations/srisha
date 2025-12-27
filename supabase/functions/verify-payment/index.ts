// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import HmacSha256 from "npm:crypto-js@4.2.0/hmac-sha256.js";
import Hex from "npm:crypto-js@4.2.0/enc-hex.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS Preflight - Fail Safe
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = await req.json();

    console.log("Processing verification for:", { orderId, razorpay_payment_id });

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error("Missing payment details");
      return new Response(
        JSON.stringify({ error: "Missing required payment details" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const secret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!secret) {
        console.error("Razorpay secret not configured");
        return new Response(
            JSON.stringify({ error: "Server configuration error: RAZORPAY_KEY_SECRET missing" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
    }

    // Verify Signature using crypto-js from npm (stable)
    const generated_signature = HmacSha256(
      razorpay_order_id + "|" + razorpay_payment_id,
      secret
    ).toString(Hex);

    if (generated_signature !== razorpay_signature) {
      console.error("Signature mismatch:", { generated_signature, razorpay_signature });
      return new Response(
        JSON.stringify({ error: "Invalid payment signature" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase (Service Role)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
       console.error("Supabase config missing");
       return new Response(
           JSON.stringify({ error: "Server configuration error: Supabase Creds missing" }),
           { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
       );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update Order using ID
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: "PAID",
        order_status: "CONFIRMED", 
        payment_reference: razorpay_order_id,
      })
      .eq("id", orderId)
      .select();

    // Verify Update Success
    if (updateError) {
       console.error("Database update failed:", updateError);
       return new Response(
        JSON.stringify({ 
            success: false, 
            error: `Database update failed: ${updateError.message || JSON.stringify(updateError)}`,
            details: updateError
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
       );
    }

    // Log Event
    try {
      await supabase.from("order_events").insert({
        order_id: orderId,
        status: "CONFIRMED",
        created_at: new Date().toISOString(),
        payload: { 
            event: "PAYMENT_CONFIRMED", 
            payment_id: razorpay_payment_id,
            verified: true 
        }
      });
    } catch (evtErr) {
        console.error("Failed to log order event:", evtErr);
        // non-blocking
    }

    console.log("Order updated successfully:", updatedOrder?.[0]?.id || "No Data returned");

    return new Response(
      JSON.stringify({ 
          success: true, 
          message: "Payment verified and order confirmed",
          razorpay_payment_id,
          order: updatedOrder?.[0]
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("Verification error:", error);
    return new Response(
      JSON.stringify({ error: `Internal verification error` }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
