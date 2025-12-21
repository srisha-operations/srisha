# Payment Flow Implementation Guide

## Overview

This document describes the backend-driven payment flow implemented for SRISHA. The system is designed to:

1. **Create orders on the backend** with initial state: `status="PENDING"`, `payment_status="INITIATED"`
2. **Call payment gateway** via Edge Function to create payment intents (stubbed if keys unavailable)
3. **Handle webhooks** from payment gateway to update order status to PAID/FAILED
4. **Frontend never assumes success** — it waits for backend confirmation via webhook or polling

---

## Architecture

### Frontend Flow (Checkout.tsx)

```
1. User fills form → validateCheckoutForm()
2. Submit → createOrder() (REST API call)
   → Creates orders + order_items with status="PENDING", payment_status="INITIATED"
   → Returns orderId, orderNumber
3. Call initiatePayment() service
   → Calls Edge Function: initiate-payment
   → Returns payment response with next action
4. Handle payment response
   → If success: Navigate to /orders (wait for webhook)
   → If failed: Show error, allow retry
5. Webhook updates order.payment_status to PAID/FAILED and order.status to CONFIRMED/CANCELLED
   → Frontend polls /orders to see updated status
```

### Backend Flow

**Edge Function: `initiate-payment`**
- Receives: orderId, amount, customer details
- Creates payment intent with gateway (or stubs if no keys)
- Updates orders.payment_status = "INITIATED"
- Stores orders.payment_reference (gateway reference)
- Returns: Safe response with nextAction (redirect/modal/poll)

**Edge Function: `payment-webhook`**
- Receives: Webhook from payment gateway
- Verifies webhook signature (stubbed if no keys)
- Parses payment status from webhook
- Updates orders.payment_status = "PAID" or "FAILED"
- Updates orders.status = "CONFIRMED" (on PAID) or "CANCELLED" (on FAILED)

---

## Database Schema

The implementation assumes these columns in the `orders` table:

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  order_number VARCHAR(255),
  user_id UUID REFERENCES auth.users(id),
  
  -- Customer info
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  
  -- Shipping
  shipping_address JSONB,
  
  -- Order status
  status VARCHAR(50), -- e.g., PENDING, CONFIRMED, FAILED, SHIPPED
  is_preorder BOOLEAN DEFAULT FALSE,
  
  -- Payment tracking (new)
  payment_status VARCHAR(50), -- e.g., INITIATED, PAID, FAILED
  payment_reference VARCHAR(255), -- Gateway-specific reference/order_id
  payment_gateway VARCHAR(50), -- e.g., razorpay, cashfree, stripe
  
  -- Amounts
  total_amount DECIMAL(12, 2),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Fields for Payment:**
- `payment_status`: Tracks payment state (INITIATED → PAID or FAILED)
- `payment_reference`: Gateway-specific reference for webhook matching
- `payment_gateway`: Identifies which gateway processed the payment

---

## Environment Variables

Set these in your Supabase project settings (Settings → Edge Functions):

```bash
# Payment gateway configuration
PAYMENT_GATEWAY=stubbed  # or: razorpay, cashfree, stripe

# Gateway API keys (optional for now)
RAZORPAY_KEY_ID=your_key_here
RAZORPAY_KEY_SECRET=your_secret_here

# Webhook verification secret
WEBHOOK_SECRET=your_webhook_secret_here

# Supabase service role (auto-set by Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Local Testing

### 1. Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your Supabase project
supabase link --project-ref <your-project-ref>

# Deploy functions
supabase functions deploy initiate-payment
supabase functions deploy payment-webhook
```

### 2. Test Payment Initiation Locally

```bash
# Start Supabase local environment (if available)
supabase start

# Test initiate-payment function
curl -X POST http://localhost:54321/functions/v1/initiate-payment \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "550e8400-e29b-41d4-a716-446655440000",
    "orderNumber": "SO-00001",
    "amount": 5000,
    "customerEmail": "customer@example.com",
    "customerName": "John Doe",
    "customerPhone": "9876543210"
  }'
```

### 3. Test Webhook Locally

```bash
# Test payment-webhook function
curl -X POST http://localhost:54321/functions/v1/payment-webhook \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "payment.authorized",
    "payload": {
      "order": {
        "entity": {
          "receipt": "SO-00001",
          "amount": 500000
        }
      }
    }
  }'
```

---

## Integration with Payment Gateways

### Razorpay Integration

When Razorpay keys are available, update `initiate-payment`:

```typescript
// 1. Create order
const gatewayResponse = await fetch("https://api.razorpay.com/v1/orders", {
  method: "POST",
  headers: {
    "Authorization": "Basic " + btoa(RAZORPAY_KEY_ID + ":" + RAZORPAY_KEY_SECRET),
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    amount: amount * 100, // Convert to paise
    currency: "INR",
    receipt: orderNumber,
  }),
});

const order = await gatewayResponse.json();

// 2. Store reference and return checkout key
return {
  success: true,
  paymentStatus: "INITIATED",
  paymentReference: order.id,
  paymentGateway: "razorpay",
  nextAction: "modal", // Or "redirect"
  // For client-side modal, also return:
  checkoutData: {
    key: RAZORPAY_KEY_ID,
    order_id: order.id,
    // ... other Razorpay checkout params
  },
};
```

### Webhook Signature Verification (Razorpay)

```typescript
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

async function verifyRazorpaySignature(body: any, secret: string): Promise<boolean> {
  const message = body.razorpay_order_id + "|" + body.razorpay_payment_id;
  const signature = body.razorpay_signature;
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const computed = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message)
  );
  
  const hex = Array.from(new Uint8Array(computed))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  
  return hex === signature;
}
```

---

## Checkout Flow States

### Order Creation → Payment Initiation

| Stage | orders.status | orders.payment_status | Action |
|-------|---------------|-----------------------|--------|
| Initial | PENDING | INITIATED | Edge Function creates payment intent |
| Webhook (success) | CONFIRMED | PAID | Customer paid; order ready to ship |
| Webhook (failure) | CANCELLED | FAILED | Customer did not pay; order cancelled |
| Timeout (24h) | PENDING | INITIATED | No webhook; order may be abandoned |

---

## Handling Payment Failures

### Scenario 1: Frontend Error (Network Issues)

```
User submits order → Order created → initiatePayment() fails
→ Show toast: "Payment initiation failed"
→ Order still visible on /orders page
→ User can retry from Orders page
```

### Scenario 2: Webhook Never Arrives

```
Order created → Payment initiated → No webhook after 24h
→ Order remains in PENDING/INITIATED state
→ Admin can see order and retry payment or mark as manual
```

### Scenario 3: Duplicate Webhooks

```
Webhook arrives twice → idempotent logic checks current state
→ Second webhook sees order already PAID/FAILED
→ Second webhook is acknowledged but order not re-updated
```

---

## Preorder Flow (Unchanged)

For `is_preorder=true` orders:
- `status` = "pending_approval" (admin review)
- `payment_status` = null (no payment required)
- Admin updates status manually after review

---

## Future Enhancements

1. **Payment Methods**: Support UPI, cards, wallets
2. **Idempotency Keys**: Prevent duplicate orders from network retries
3. **Payment Retry**: Allow customer to retry payment from order detail page
4. **Refund Handling**: Create refund edge function for cancellations
5. **Payment Analytics**: Track conversion funnel and failure reasons
6. **Fraud Detection**: Integrate with gateway fraud tools

---

## Troubleshooting

### Issue: `initiatePayment()` returns 404 (Edge Function not found)

**Solution**: Ensure Edge Functions are deployed:
```bash
supabase functions deploy initiate-payment --project-ref <ref>
```

### Issue: `payment_status` column not found

**Solution**: Check if your `orders` table schema includes `payment_status`, `payment_reference`, and `payment_gateway` columns. If not, add them:

```sql
ALTER TABLE public.orders ADD COLUMN payment_status VARCHAR(50);
ALTER TABLE public.orders ADD COLUMN payment_reference VARCHAR(255);
ALTER TABLE public.orders ADD COLUMN payment_gateway VARCHAR(50);
```

### Issue: Webhook not updating order status

**Solution**:
1. Check RLS policies allow service role to update orders
2. Verify webhook signature verification is disabled during testing
3. Check Edge Function logs for errors
4. Manually test webhook endpoint with curl

### Issue: `Deno.env.get()` returns null

**Solution**: Set environment variables in Supabase project settings, not in `.env` file. Edge Functions access secrets via `Deno.env.get()`.

---

## Testing Checklist

- [ ] Order creation sets `payment_status="INITIATED"`
- [ ] `initiatePayment()` successfully calls Edge Function
- [ ] Order fields updated with `payment_reference` and `payment_gateway`
- [ ] Frontend redirects to /orders and shows loading state
- [ ] Webhook handler correctly parses gateway response
- [ ] Webhook updates `payment_status` to PAID/FAILED
- [ ] `payment_status` update also updates `order.status`
- [ ] Duplicate webhooks are idempotent
- [ ] Admin sees updated order status in /admin/orders
- [ ] Preorders still bypass payment flow

---

## Support & Next Steps

1. **Gateway Integration**: When keys are available, update Edge Functions with real API calls
2. **Frontend Payment UI**: Implement Razorpay Checkout modal or redirect based on nextAction
3. **Admin Dashboard**: Add payment status filters and retry payment action
4. **Webhooks**: Configure gateway to POST to `/functions/v1/payment-webhook`

