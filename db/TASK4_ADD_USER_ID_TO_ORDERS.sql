-- ========================================
-- MIGRATION: ADD USER_ID TO ORDERS TABLE
-- ========================================
-- This migration adds user_id column to orders table with:
-- 1. Foreign key constraint to auth.users
-- 2. RLS policy to restrict user access to own orders
-- 3. Nullable user_id to support guest checkouts

-- Step 1: Add user_id column with foreign key constraint
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 2: Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- Step 3: Enable Row Level Security on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies if any (optional cleanup)
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;

-- Step 5: Create RLS policy - Allow users to view only their own orders
CREATE POLICY "Users can view their own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.admins WHERE public.admins.id = auth.uid()
    )
  );

-- Step 6: Create RLS policy - Allow admins to view all orders
CREATE POLICY "Admins can view all orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins WHERE public.admins.id = auth.uid()
    )
  );

-- Step 7: Allow authenticated users to insert their own orders
CREATE POLICY "Users can create orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Step 8: Allow admins to update any order status
CREATE POLICY "Admins can update orders"
  ON public.orders
  FOR UPDATE
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

-- Verification (optional - run separately to test):
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'orders' AND column_name = 'user_id';
-- 
-- SELECT indexname FROM pg_indexes WHERE tablename = 'orders' AND indexname LIKE '%user_id%';
-- 
-- SELECT policyname FROM pg_policies WHERE tablename = 'orders';
