# Status Mapping Correction - VERIFIED

## Change Summary

**Issue**: Edge Function webhook handler was mapping failed payments to `order_status='FAILED'`, but the database constraint only allows: `PENDING | CONFIRMED | DISPATCHED | DELIVERED | CANCELLED`

**Fix Applied**: Map payment failures to `CANCELLED` status instead

## Files Updated

### 1. `supabase/functions/payment-webhook/index.ts`
```typescript
// BEFORE:
const newOrderStatus = webhookData.paymentStatus === "PAID" ? "CONFIRMED" : "FAILED";

// AFTER:
const newOrderStatus = webhookData.paymentStatus === "PAID" ? "CONFIRMED" : "CANCELLED";
```

### 2. `PAYMENT_FLOW_GUIDE.md`
- Updated Order Lifecycle table: Failed → CANCELLED
- Updated webhook description: "CONFIRMED or CANCELLED" instead of "CONFIRMED or FAILED"

### 3. `IMPLEMENTATION_SUMMARY.md`
- Updated Order Lifecycle diagram: payment failure maps to CANCELLED

### 4. `src/pages/OrderDetail.tsx`
Enhanced payment status display with clear user-facing messages:
```typescript
{
  order.payment_status === "INITIATED" ? "Awaiting payment confirmation" :
  order.payment_status === "PAID" ? "✓ Order confirmed" :
  order.payment_status === "FAILED" ? "✗ Payment failed, retry available" :
  order.payment_status || "Unknown"
}
```

Updated Stepper status mapping:
- CANCELLED → step 0 (not started)
- PENDING → step 1 (order placed)
- CONFIRMED → step 2 (confirmed)
- DISPATCHED → step 3 (dispatched)
- DELIVERED → step 4 (delivered)

### 5. `src/pages/Orders.tsx`
Enhanced payment status in order list with same user-facing messages:
- INITIATED → "Awaiting confirmation"
- PAID → "✓ Confirmed"
- FAILED → "✗ Failed, retry available"

## Order Status Lifecycle (Corrected)

### Normal Order Flow
```
User submits order
    ↓
status = "PENDING"
payment_status = "INITIATED"
    ↓
Payment gateway webhook arrives (success)
    ↓
status = "CONFIRMED" ← Ready to ship
payment_status = "PAID"
    ↓
Admin ships order
    ↓
status = "DISPATCHED"
    ↓
Order delivered
    ↓
status = "DELIVERED"
```

### Payment Failure Flow
```
User submits order
    ↓
status = "PENDING"
payment_status = "INITIATED"
    ↓
Payment gateway webhook arrives (failure)
    ↓
status = "CANCELLED" ← Customer must retry or contact support
payment_status = "FAILED"
    ↓
Customer retries payment from /orders/:id
    ↓
If successful: status = "CONFIRMED", payment_status = "PAID"
If fails again: remains CANCELLED, payment_status = "FAILED"
```

### Order Cancellation (Admin Action)
```
Admin cancels order from /admin/orders/:id
    ↓
status = "CANCELLED"
payment_status = stays as is (INITIATED, PAID, or FAILED)
```

## UI Display

### On /orders page (Order List)

**Payment Status Examples:**
- "Awaiting confirmation" → INITIATED
- "✓ Confirmed" → PAID
- "✗ Failed, retry available" → FAILED

**Order Status Examples:**
- "Pending" → PENDING
- "Confirmed" → CONFIRMED
- "Dispatched" → DISPATCHED
- "Delivered" → DELIVERED
- "Cancelled" → CANCELLED

### On /orders/:id page (Order Detail)

**Payment Section:**
```
Payment: Awaiting payment confirmation  [status: INITIATED]
         ✓ Order confirmed             [status: PAID]
         ✗ Payment failed, retry available [status: FAILED]

Status: Pending / Confirmed / Dispatched / Delivered / Cancelled
```

**Tracking Stepper:**
- Cancelled orders show as "Not started" (step 0)
- All other states follow normal progression

## Constraint Compliance

✅ **Database Constraint Verified**: `order.status` only accepts these values:
- PENDING
- CONFIRMED
- DISPATCHED
- DELIVERED
- CANCELLED

✅ **All Code Updated**: Payment failure now maps to CANCELLED (not FAILED)

✅ **UI Displays Correct States**: Order detail and list pages show appropriate messages for all payment/order states

✅ **Build Verified**: No errors or warnings introduced by changes

## Testing Notes

When testing payment failures:
1. Order is created with `status="PENDING"`, `payment_status="INITIATED"`
2. Webhook arrives with failure status
3. Backend updates: `status="CANCELLED"`, `payment_status="FAILED"`
4. Frontend displays: "Payment failed, retry available"
5. Customer can retry payment or contact support

Order remains in CANCELLED status in database but UI makes it clear this is due to payment failure, not admin cancellation.

## Ready for Approval

✅ Status mapping corrected
✅ Database constraint respected
✅ UI displays proper messages
✅ Build successful
✅ Documentation updated
✅ No new errors introduced

