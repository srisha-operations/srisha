-- ========================================
-- Migration: Fix Orders Table Schema
-- ========================================
-- Description: Add missing columns and remove legacy columns from orders table
-- Run this in Supabase SQL editor

-- Step 1: Add missing columns for new checkout flow
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS shipping_address JSONB,
  ADD COLUMN IF NOT EXISTS customer_city TEXT,
  ADD COLUMN IF NOT EXISTS customer_state TEXT,
  ADD COLUMN IF NOT EXISTS customer_pincode TEXT;

-- Step 2: Remove legacy 'total' column if it exists
-- (Only run if you've migrated all existing orders to total_amount)
-- ALTER TABLE public.orders DROP COLUMN IF EXISTS total;

-- Step 3: Create index on shipping_address for better query performance (optional)
-- CREATE INDEX IF NOT EXISTS idx_orders_shipping_address ON public.orders USING GIN (shipping_address);

-- Verify the columns exist
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'orders' 
-- ORDER BY ordinal_position;