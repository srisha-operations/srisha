# Task 4: Add user_id to Orders Table - SQL Migration Instructions

## Overview

This task adds `user_id` column to the `orders` table with:
- Foreign key constraint to `auth.users`
- Row Level Security (RLS) policies for user/admin access control
- Support for both authenticated users and guest checkouts

## Pre-requisites

✅ **What you need:**
- Access to your Supabase project dashboard
- The admin user's UUID (from Supabase Auth > Users)
- Read access to this guide

## Step-by-Step Instructions

### Step 1: Verify Your Admin User UUID

1. Open Supabase Dashboard → **Authentication** → **Users**
2. Find your admin user email
3. Copy the **UUID** column value (looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
4. Keep this UUID handy for the next steps

### Step 2: Run the Migration in Supabase SQL Editor

1. Open Supabase Dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents from `db/TASK4_ADD_USER_ID_TO_ORDERS.sql`
5. Paste into the SQL Editor
6. Click **Run** (green play button)
7. Wait for completion - you should see: ✅ Query succeeded

**Expected Output:**
```
ALTER TABLE 0
CREATE INDEX 0
ALTER TABLE 0
CREATE POLICY 0
CREATE POLICY 0
CREATE POLICY 0
CREATE POLICY 0
```

### Step 3: Verify the Migration

Run this verification query in a **New Query**:

```sql
-- Check if user_id column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'user_id';

-- Check if index was created
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'orders' AND indexname LIKE '%user_id%';

-- Check if RLS policies exist
SELECT policyname, qual, with_check 
FROM pg_policies 
WHERE tablename = 'orders';
```

You should see:
- 1 row for user_id column (type: uuid)
- 1 row for index: `idx_orders_user_id`
- 4 rows for RLS policies

### Step 4: Verify RLS is Enabled

Run this query:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'orders';
```

Expected result:
- `rowsecurity` = `true` (RLS is enabled)

## What This Migration Does

### User Access Control

| User Type | Can View Orders | Can Create Orders | Can Update Orders |
|-----------|-----------------|-------------------|-------------------|
| Guest (no auth) | ❌ No | ❌ No (guest orders have null user_id) | ❌ No |
| Authenticated User | ✅ Own orders only | ✅ With their user_id | ❌ No |
| Admin | ✅ All orders | ✅ Yes | ✅ Yes |

### Database Schema Changes

**New Column:**
```sql
user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
```

**New Index:**
```sql
idx_orders_user_id ON orders(user_id)
```

**RLS Policies Created:**
1. `Users can view their own orders` - Authenticated users see only their orders
2. `Admins can view all orders` - Admins see all orders
3. `Users can create orders` - Authenticated users can insert with their user_id
4. `Admins can update orders` - Admins can update any order status

## Important Notes

⚠️ **Guest Checkouts:**
- Guests can still checkout with `user_id = NULL`
- These orders won't be visible to users (unless they become admin)
- Useful for anonymous purchases

✅ **Existing Data:**
- Existing orders will have `user_id = NULL`
- They will still be accessible to admins
- No data migration needed

📝 **Order Creation:**
- Code in `src/services/checkout.ts` already supports `user_id`
- If user is authenticated, `user_id` is automatically set
- If user is guest, `user_id` remains NULL

## Troubleshooting

### Error: "Column already exists"
- This is fine! The migration uses `IF NOT EXISTS`
- You can safely re-run the migration

### Error: "Foreign key constraint fails"
- Likely the `auth.users` table doesn't exist in your schema
- Check: Does Supabase show an `auth.users` table in Table Editor?
- If not, enable auth in Supabase project settings

### Error: "RLS policy already exists"
- The migration drops old policies first
- This is expected if you've run Task 4 before
- Safe to re-run

### RLS policies don't seem to work
- Make sure your admin user UUID is in the `admins` table:
  ```sql
  INSERT INTO public.admins (id) 
  VALUES ('YOUR_ADMIN_UUID')
  ON CONFLICT DO NOTHING;
  ```

## Next Steps

After this migration runs successfully:

1. **Test guest checkout** - Add item to cart, checkout without signing in
   - Order should be created with `user_id = NULL`

2. **Test authenticated checkout** - Sign in, add item, checkout
   - Order should be created with your `user_id`
   - Verify order appears in Admin Dashboard (Task 6)

3. **Proceed to Task 5** - Header solid background on /checkout path

## Rollback (if needed)

If you need to undo this migration:

```sql
-- Remove the user_id column and policies
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP INDEX IF EXISTS idx_orders_user_id;
ALTER TABLE public.orders DROP COLUMN IF EXISTS user_id;
```

Then run this in a new query to confirm:

```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'user_id';
-- Should return: (0 rows) - column is gone
```

---

**Migration Status:** ✅ SQL file created and committed
**Commit Hash:** See `git log` for TASK4 commit
**File Location:** `db/TASK4_ADD_USER_ID_TO_ORDERS.sql`
