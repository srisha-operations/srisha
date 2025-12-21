-- ========================================
-- Migration: Move order_number generation to database
-- ========================================
-- Description: Create global sequence for order_number to avoid client-side collisions
-- This ensures order_number is globally unique regardless of concurrent users/sessions
--
-- Run this in Supabase SQL Editor

-- Step 1: Create global sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq;

-- Step 2: Set orders.order_number to use the sequence as default
-- Format: SO-00001, SO-00002, SO-00003, etc.
ALTER TABLE public.orders
ALTER COLUMN order_number
SET DEFAULT 'SO-' || lpad(nextval('order_number_seq')::text, 5, '0');

-- Step 3: Verify the sequence exists and default is set
-- SELECT column_name, column_default FROM information_schema.columns
-- WHERE table_name = 'orders' AND column_name = 'order_number';
-- Expected: column_default = 'SO-'::text || lpad(nextval('order_number_seq'::regclass)::text, 5, '0'::text)
