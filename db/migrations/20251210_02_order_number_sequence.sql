-- ========================================
-- Migration 2: Create Order Number Sequence and Trigger
-- ========================================
-- Description: Auto-generates unique, human-readable order numbers (ORD-000001, ORD-000002, etc.)
-- Run this second in Supabase SQL editor
-- ========================================

-- Create sequence for order numbers (starts at 1, increments by 1)
CREATE SEQUENCE IF NOT EXISTS order_number_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- Create function to auto-generate order_number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate order number if not already set (format: ORD-000001, ORD-000002, etc.)
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'ORD-' || LPAD(nextval('order_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call set_order_number() before inserting
DROP TRIGGER IF EXISTS trigger_set_order_number ON orders;
CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Verification: Check the sequence and function were created
-- SELECT * FROM information_schema.sequences WHERE sequence_name = 'order_number_seq';
-- SELECT proname FROM pg_proc WHERE proname = 'set_order_number';