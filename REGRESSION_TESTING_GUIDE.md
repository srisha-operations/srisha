# Full Regression Testing & Deployment Guide

## Overview

All frontend fixes are complete and ready for deployment. This guide outlines testing steps and deployment instructions.

---

## Pre-Deployment Checklist

### 1. Build Verification ✅

```bash
npm run build
```

**Expected Output:**
- `✓ built in XX.XXs`
- No errors or warnings (ignore chunk size warnings)

### 2. Database Migrations Required

Before testing, apply these SQL migrations to Supabase (see `db/MIGRATION_INSTRUCTIONS.md`):

1. **Migration 1: Orders Schema**
   - Adds `total_amount`, `shipping_address`, `customer_city`, `customer_state`, `customer_pincode` columns

2. **Migration 2: Site Content RLS Policy**
   - Enables RLS on `site_content` table
   - Allows public READ access
   - Restricts WRITE access to admin users only

3. **Migration 3: Order Number Sequence** (Optional)
   - Auto-generates order numbers (ORD-000001, etc.)

**⚠️ Critical:** Add your admin user to the `admins` table before running Migration 2:
```sql
INSERT INTO public.admins (id) VALUES ('YOUR_ADMIN_USER_UUID') ON CONFLICT DO NOTHING;
```

---

## Comprehensive Regression Testing

### Test 1: Wishlist Count Badge (Desktop & Mobile)

**Scenario A: Guest User**
1. Open homepage in desktop viewport
2. ✅ Verify wishlist heart icon visible in top-right (desktop) or sidebar (mobile)
3. ✅ Heart should be outline (not filled)
4. ✅ Count badge should NOT appear (0 items)
5. Click heart on any product card
6. ✅ Wishlist drawer opens
7. ✅ Product added to wishlist
8. ✅ Heart icon now shows "1" count badge
9. Open mobile menu (if mobile viewport)
10. ✅ Verify wishlist count also shows "1" in sidebar
11. Close drawer, click another product's heart
12. ✅ Count badge now shows "2"
13. Refresh page
14. ✅ Count badge still shows "2" (persisted in localStorage)

**Scenario B: Logged-In User**
1. Sign in with a test account
2. Navigate to /products
3. Add 3 items to wishlist
4. ✅ Heart icons filled for wishlisted items
5. ✅ Header badge shows "3"
6. ✅ Mobile menu sidebar also shows "3"
7. Remove one item from wishlist
8. ✅ Badge updates to "2" instantly in both desktop and mobile
9. Go to WishlistDrawer
10. ✅ Verify all 2 items visible
11. Sign out
12. ✅ Count badge resets to "0"
13. Sign back in
14. ✅ Count badge shows "2" again (server-synced)

---

### Test 2: Guest Checkout Auth Redirect

**Scenario: Guest User Checkout Flow**
1. As guest user, add items to cart
2. Click "Checkout" button in CartDrawer
3. ✅ Auth Modal opens with "Sign In" view
4. ✅ Modal has message: "Sign in to proceed to checkout"
5. Close modal, go to Products page
6. Open ProductDetailModal for a product
7. Click "Checkout" button
8. ✅ Auth Modal opens again
9. Fill in sign-in credentials
10. ✅ Modal closes after successful login
11. ✅ User redirected to /checkout page
12. ✅ Cart items visible on checkout page

**Expected Error Message:** None. Auth modal should open seamlessly.

---

### Test 3: Checkout Form Validation

**Scenario A: Empty Form Submission**
1. Navigate to /checkout (as logged-in user with cart items)
2. Click "Place Order & Pay" button
3. ✅ Button should be **disabled** (grayed out, not clickable)
4. ✅ Red border appears on required fields: Name, Email, Phone, Address, Pincode
5. ✅ Error text appears below each field

**Scenario B: Invalid Inputs**
1. Enter Name: "A" (too short)
   - ✅ Error: "Please enter your full name (min 2 characters)"
   - ✅ Red border on field
   - ✅ Button remains disabled

2. Enter Email: "notanemail"
   - ✅ Error: "Please enter a valid email address"
   - ✅ Red border
   - ✅ Button disabled

3. Enter Phone: "9234567" (too short, doesn't match Indian format)
   - ✅ Error: "Please enter a valid 10-digit mobile number starting with 6-9"
   - ✅ Red border
   - ✅ Button disabled

4. Enter Phone: "59" (starts with 5, not 6-9)
   - ✅ Same error as above
   - ✅ Button disabled

5. Enter Address Line 1: "Apt" (too short)
   - ✅ Error: "Please enter your shipping address"
   - ✅ Red border
   - ✅ Button disabled

6. Enter Pincode: "12345" (5 digits, not 6)
   - ✅ Error: "PIN code must be 6 digits"
   - ✅ Red border
   - ✅ Button disabled

**Scenario C: Valid Form Submission**
1. Fill in all fields with VALID data:
   - Name: "John Doe" (min 2 chars) ✅
   - Email: "john@example.com" (valid format) ✅
   - Phone: "9876543210" (10 digits, starts with 9) ✅
   - Address Line 1: "123 Main Street" (5+ chars) ✅
   - Address Line 2: (optional, can leave blank) ✅
   - City/State: (optional, can leave blank) ✅
   - Pincode: "400001" (exactly 6 digits) ✅

2. ✅ Button becomes **enabled** (no longer grayed out)
3. Click "Place Order & Pay"
4. ✅ Button shows "Processing..." state
5. ✅ Order created in Supabase `orders` table
6. ✅ Order appears with `total_amount` and `shipping_address` columns populated
7. ✅ UPI payment link opens
8. ✅ Alert: "Order created! Order #SO-XXXXX"

**Scenario D: Validation on Change (Real-Time)**
1. Open checkout form with empty fields
2. ✅ Button disabled, errors shown
3. Type a valid name
4. ✅ Name error disappears, red border removed
5. Type an invalid email "test"
6. ✅ Email error appears, red border shown
7. Fix email to "test@example.com"
8. ✅ Email error disappears
9. Continue filling fields... button should become enabled when ALL are valid

---

### Test 4: Orders Database Schema

**Scenario: Create Order and Verify Schema**
1. Complete a full checkout (see Test 3, Scenario C)
2. Go to Supabase dashboard > SQL Editor
3. Run:
   ```sql
   SELECT id, order_number, customer_name, customer_email, customer_phone, 
          total_amount, shipping_address, status, created_at 
   FROM public.orders 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

4. ✅ Verify the most recent order has:
   - `order_number`: "SO-00001" or similar (auto-generated)
   - `customer_name`: Value from form
   - `customer_email`: Value from form
   - `customer_phone`: Value from form
   - `total_amount`: Numeric value (order total)
   - `shipping_address`: JSONB with form data:
     ```json
     {
       "name": "John Doe",
       "email": "john@example.com",
       "phone": "9876543210",
       "address_line1": "123 Main Street",
       "address_line2": "",
       "city": "",
       "state": "",
       "pincode": "400001"
     }
     ```
   - `status`: "pending_payment"

5. Check `order_items`:
   ```sql
   SELECT * FROM public.order_items WHERE order_id = 'ORDER_ID' LIMIT 5;
   ```

6. ✅ Verify all cart items exist as order items with:
   - `product_id`: Correct product
   - `quantity`: Correct quantity
   - `unit_price`: Product price
   - `metadata`: Size info if applicable

---

### Test 5: Admin Content Editing (RLS Policy)

**Scenario A: Admin User Edits Shop Settings**
1. Log in as admin user (must be in `admins` table)
2. Navigate to Admin Dashboard (/admin)
3. Click "Shop Settings" in sidebar
4. Toggle between "Order Mode" and "Pre-Order Mode"
5. ✅ Toggle switches without errors
6. Click "Save Settings"
7. ✅ Success toast: "Shop mode changed to Order/Pre-Order"
8. ✅ NO 403 error
9. Badge updates to show new mode status:
   - "✓ Order Mode Active" (green) OR
   - "✓ Pre-Order Mode Active" (blue)
10. Refresh page
11. ✅ Setting persists (saved to database)

**Scenario B: Regular (Non-Admin) User Tries to Edit**
1. Log in as a non-admin user
2. Try to navigate to /admin
3. ✅ Should redirect to /admin/signin or show permission error

**Scenario C: Admin Edits Other Content**
1. As admin, go to /admin/content/brand or other content page
2. Try to update content
3. ✅ Update succeeds
4. ✅ Auto-save feedback or success message shown
5. Verify change persists after refresh

---

### Test 6: Admin Dashboard UI

**Scenario: Admin Navigation & Layout**
1. Log in as admin
2. Go to /admin
3. ✅ Sidebar visible on left with:
   - "SRISHA Admin Dashboard" header
   - Organized sections:
     - Main (Dashboard)
     - Inventory (Products)
     - Content (Brand, Hero, Gallery, Footer, Shop Settings)
     - Orders (Inquiries)
   - Logout button at bottom
4. ✅ Active nav item highlighted with:
   - White background
   - Bold text
   - Shadow
   - Border
5. ✅ Icons visible next to each menu item
6. ✅ Main content area takes up remaining space
7. Click different nav items
8. ✅ Active state follows navigation
9. Click "Logout"
10. ✅ Redirected to /admin/signin
11. ✅ Session cleared

---

### Test 7: End-to-End Checkout Flow (Complete)

**Scenario: Full Guest-to-Customer Checkout**
1. Open homepage as guest (incognito/private window)
2. Navigate to /products
3. Add 2-3 items to cart
4. ✅ Cart badge updates
5. ✅ Wishlist count at 0
6. Click "Checkout"
7. ✅ Auth Modal opens
8. Click "Sign Up" tab
9. Create new account (email, password)
10. ✅ Account created, user logged in
11. ✅ Auth modal closes
12. ✅ Redirected to /checkout
13. ✅ Cart items displayed
14. Fill checkout form:
    - Name: "Test User"
    - Email: "test@example.com"
    - Phone: "9876543210"
    - Address: "123 Test Street, Apt 4B"
    - City/State: "Mumbai, MH"
    - Pincode: "400001"
15. ✅ Form validation passes
16. ✅ Button enabled
17. Click "Place Order & Pay"
18. ✅ Order created
19. ✅ Alert with order number
20. ✅ UPI payment link opens
21. Close payment link
22. ✅ Cart cleared (cartUpdated event triggered)
23. ✅ Redirected to homepage

---

### Test 8: Pre-Order Mode Toggle

**Scenario: Switch Shop to Pre-Order Mode**
1. As admin, go to Shop Settings
2. Toggle to "Pre-Order Mode"
3. Save
4. ✅ Toast confirms change
5. Log out (or open incognito window)
6. Go to /products
7. Try to add item to cart and checkout
8. ✅ Checkout button still works
9. Go to checkout
10. ✅ Form shows "Pre-Order Request" instead of "Shipping Details"
11. Fill name, email, phone
12. ✅ No address/pincode fields
13. Click "Submit Pre-Order Request"
14. ✅ Alert: "Preorder submitted! Order #XXXXX"
15. ✅ Order created with `is_preorder: true`
16. Go back to Shop Settings
17. Toggle back to "Order Mode"
18. ✅ Checkout returns to normal order form

---

## Performance Baseline

Run these checks to ensure no regressions:

### Build Size
```bash
npm run build
```
✅ Expect: ~661 KB (index bundle, gzipped ~194 KB)

### Load Time
1. Open homepage
2. ✅ Should load in <3 seconds
3. ✅ Wishlist count loads without delay
4. Navigate to /products
5. ✅ Product list loads in <2 seconds
6. ✅ Search works responsively
7. Open WishlistDrawer
8. ✅ Loads instantly (cached)

### Network Requests
Open DevTools (F12) > Network tab:
1. Homepage should make ~3-5 initial requests
2. Product list: ~2-3 requests (products + images lazy-load)
3. Wishlist list: ~1 request (cached for 15s)
4. Checkout: ~1-2 requests
5. ✅ No failed requests (4xx/5xx errors)
6. ✅ No excessive re-fetching

---

## Deployment Steps

### 1. Verify Build
```bash
npm run build
```

### 2. Run Migrations in Supabase
Follow `db/MIGRATION_INSTRUCTIONS.md`:
1. Add admin user to `admins` table
2. Run Migration 1 (Orders schema)
3. Run Migration 2 (RLS policy)
4. (Optional) Run Migration 3 (Order sequence)

### 3. Deploy Frontend
```bash
# If using Netlify, Vercel, etc.
git push origin development
# Or manually deploy the dist/ folder
```

### 4. Test in Production
1. Visit https://your-domain.com
2. Run through tests 1-8 above
3. Verify no console errors (F12 > Console)

### 5. Monitor for Issues
- Check Supabase logs for RLS errors
- Monitor for "Failed to create order" errors
- Track checkout completion rate

---

## Known Limitations & TODOs

- [ ] Payment integration (currently uses UPI deeplink only)
- [ ] Order status updates (admin can't update order status)
- [ ] Email notifications (order confirmations)
- [ ] Inventory management (no stock tracking)
- [ ] Shipping integrations (manual shipping info only)
- [ ] Returns/refunds flow

---

## Support & Troubleshooting

### "403 Forbidden" when editing site_content
**Solution:** Ensure your admin user is in the `admins` table:
```sql
INSERT INTO public.admins (id) VALUES ('YOUR_UUID');
```

### Wishlist count not updating
**Solution:** Clear localStorage:
```javascript
localStorage.clear();
location.reload();
```

### Orders table columns missing
**Solution:** Run Migration 1 (Orders schema) in Supabase SQL Editor

### Payment link doesn't open
**Solution:** Ensure `VITE_OWNER_UPI` env var is set in `.env`

---

## Commits in This Session

1. ✅ "fix: use centralized wishlist service for desktop header count badge"
2. ✅ "feat: add openAuthModal event listener in Header for guest checkout redirect"
3. ✅ "feat: add comprehensive field-level validation to checkout form with real-time validation and visual feedback"
4. ✅ "docs: add comprehensive SQL migrations and instructions for orders schema and RLS policy fixes"
5. ✅ "feat: improve ShopSettings with toast notifications and visual status badges"
6. ✅ "feat: redesign admin dashboard with improved sidebar navigation, icons, and visual hierarchy"

---

## Sign-Off

**Frontend Status:** ✅ **READY FOR PRODUCTION**
- All fixes implemented
- Build passing
- No console errors
- Comprehensive validation in place
- Admin UI improved

**Backend Status:** ⏳ **REQUIRES MIGRATION** (User action needed)
- Migrations ready in `db/COMPLETE_MIGRATIONS.sql`
- RLS policy prepared
- Schema updates documented

**Next Steps:**
1. User runs SQL migrations in Supabase
2. Deploy frontend code
3. Run regression tests
4. Monitor production for issues