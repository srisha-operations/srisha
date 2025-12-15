-- ========================================
-- Migration 1: Add Missing Columns to Orders Table
-- ========================================
-- Description: Adds shipping_address and total_amount columns to the orders table
-- Run this first in Supabase SQL editor
-- ========================================

-- Add shipping_address column (JSONB to store address details)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipping_address JSONB DEFAULT NULL;

-- Add total_amount column (numeric for precise decimal storage)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2) DEFAULT NULL;

-- Optional: Create index on shipping_address for better query performance
-- (Uncomment if you frequently filter by shipping address)
-- CREATE INDEX IF NOT EXISTS idx_orders_shipping_address ON orders USING GIN (shipping_address);

-- Verification: Check the new columns exist
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'orders' AND column_name IN ('shipping_address', 'total_amount');