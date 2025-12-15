# Supabase Database Migrations - Complete Instructions

## Overview

This guide walks you through applying three critical migrations to your Supabase database:

1. **Orders Table Schema Fix** - Adds columns for the new checkout flow
2. **Site Content RLS Policy** - Restricts content editing to admin users only
3. **Order Number Sequence** (Optional) - Auto-generates sequential order numbers

---

## Prerequisites

- Access to your Supabase project dashboard
- Admin privileges in your Supabase project
- The admin user's UUID (found in Supabase Auth > Users)

---

## Step-by-Step Migration Instructions

### Step 1: Verify Admin User in Database

Before running RLS migrations, ensure your admin user exists in the `admins` table:

1. In Supabase, go to **SQL Editor**
2. Run this query:
   ```sql
   SELECT id, email FROM public.admins;
   ```
3. If your admin user's UUID is NOT listed, add it:
   ```sql
   INSERT INTO public.admins (id) 
   VALUES ('YOUR_ADMIN_USER_UUID')
   ON CONFLICT DO NOTHING;
   ```
   Replace `YOUR_ADMIN_USER_UUID` with the actual UUID from Auth > Users tab.

---

### Step 2: Run Migration 1 (Orders Schema)

1. In Supabase **SQL Editor**, create a **New Query**
2. Copy and paste this exactly:

```sql
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS shipping_address JSONB,
  ADD COLUMN IF NOT EXISTS customer_city TEXT,
  ADD COLUMN IF NOT EXISTS customer_state TEXT,
  ADD COLUMN IF NOT EXISTS customer_pincode TEXT;
```

3. Click **Run**
4. You should see: `Success. No rows returned.`

✅ **Migration 1 Complete**

---

### Step 3: Run Migration 2 (Site Content RLS)

1. In Supabase **SQL Editor**, create a **New Query**
2. Copy and paste this exactly:

```sql
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public to read site_content" ON public.site_content;
CREATE POLICY "Allow public to read site_content"
  ON public.site_content
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow admins to modify site_content" ON public.site_content;
CREATE POLICY "Allow admins to modify site_content"
  ON public.site_content
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins WHERE public.admins.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admins WHERE public.admins.id = auth.uid()
    )
  );
```

3. Click **Run**
4. You should see: `Success. No rows returned.`

⚠️ **Important**: If this fails with "403 permission denied", ensure your admin user is in the `admins` table (Step 1).

✅ **Migration 2 Complete**

---

### Step 4: Run Migration 3 (Order Number Sequence) - OPTIONAL

Only run this if you want auto-generated order numbers (ORD-000001, ORD-000002, etc.).

1. In Supabase **SQL Editor**, create a **New Query**
2. Copy and paste this exactly:

```sql
CREATE SEQUENCE IF NOT EXISTS order_number_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'ORD-' || LPAD(nextval('order_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_order_number ON public.orders;
CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_number();
```

3. Click **Run**
4. You should see: `Success. No rows returned.`

✅ **Migration 3 Complete (Optional)**

---

## Post-Migration Verification

### Verify Orders Schema
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;
```
Expected columns: `id`, `user_id`, `order_number`, `status`, `total`, `total_amount`, `shipping_address`, `customer_city`, `customer_state`, `customer_pincode`, `created_at`, `updated_at`

### Verify RLS is Enabled
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'site_content';
```
Expected: `site_content` with `rowsecurity = true`

### Verify Policies Exist
```sql
SELECT policyname, qual FROM pg_policies WHERE tablename = 'site_content';
```
Expected: Two policies:
- `Allow public to read site_content`
- `Allow admins to modify site_content`

---

## What These Migrations Fix

### Migration 1: Orders Schema
**Problem**: Checkout form tries to save `shipping_address` and `total_amount` columns that don't exist in the database.

**Solution**: Adds the missing columns so checkout orders can be created successfully.

### Migration 2: Site Content RLS
**Problem**: Admin user gets "403 forbidden" error when trying to update site content (hero images, brand name, etc.).

**Solution**: Enables RLS with a policy allowing only users in the `admins` table to modify site_content.

### Migration 3: Order Number Sequence (Optional)
**Problem**: Order numbers aren't auto-generated; must be provided by the app.

**Solution**: Creates a trigger that auto-generates human-readable order numbers (ORD-000001, ORD-000002, etc.).

---

## Troubleshooting

### "ERROR: relation 'admins' does not exist"
- The `admins` table hasn't been created yet.
- Run this to create it:
  ```sql
  CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  );
  ```

### "ERROR: new row violates row-level security policy"
- Your admin user UUID is not in the `admins` table.
- Add it: `INSERT INTO public.admins (id) VALUES ('YOUR_UUID');`

### "ERROR: syntax error at or near 'DROP POLICY'"
- Supabase SQL editor sometimes has issues with this. Try running each DROP separately, then CREATE separately.

### Column already exists error
- This is fine! The `IF NOT EXISTS` clause prevents re-creation.
- The migration is idempotent and safe to run multiple times.

---

## Next Steps

1. Deploy the frontend code (already includes checkout validation and service logic):
   ```bash
   npm run build
   ```

2. Test the checkout flow as a logged-in user:
   - Add items to cart
   - Click "Checkout"
   - Fill in all required fields
   - Submit order
   - Verify order appears in Supabase `orders` table

3. Test admin content editing:
   - Log in as admin user
   - Go to admin panel
   - Try updating hero images, brand name, etc.
   - Should succeed (no 403 errors)

---

## Questions?

If migrations fail or you need help, check the exact error message and:
1. Verify the SQL syntax (copy from `db/COMPLETE_MIGRATIONS.sql` in the repo)
2. Ensure your admin user UUID is in the `admins` table
3. Check Supabase logs for detailed error info