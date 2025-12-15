-- ========================================
-- COMPLETE MIGRATION SUITE FOR SRISHA
-- ========================================
-- Run all three migrations in this order:
-- 1. Orders schema fix
-- 2. Site content RLS policy
-- 3. (Optional) Order number sequence and trigger
--
-- These migrations will be applied to your Supabase database.
-- Copy each section and run as a separate query in Supabase SQL Editor.

-- ========================================
-- MIGRATION 1: FIX ORDERS TABLE SCHEMA
-- ========================================
-- Run this first. Adds missing columns for new checkout flow.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS shipping_address JSONB,
  ADD COLUMN IF NOT EXISTS customer_city TEXT,
  ADD COLUMN IF NOT EXISTS customer_state TEXT,
  ADD COLUMN IF NOT EXISTS customer_pincode TEXT;

-- Verify columns were added (optional, for testing):
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'orders' AND column_name IN ('total_amount', 'shipping_address')
-- ORDER BY ordinal_position;


-- ========================================
-- MIGRATION 2: FIX SITE_CONTENT RLS POLICY
-- ========================================
-- Run this second. Enables admins to modify site_content.

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Allow anyone to READ site_content
DROP POLICY IF EXISTS "Allow public to read site_content" ON public.site_content;
CREATE POLICY "Allow public to read site_content"
  ON public.site_content
  FOR SELECT
  TO public
  USING (true);

-- Allow only admins (users in admins table) to CREATE/UPDATE/DELETE
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

-- Verify RLS is enabled (optional):
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'site_content';

-- Verify policies exist (optional):
-- SELECT policyname, qual, with_check FROM pg_policies WHERE tablename = 'site_content';


-- ========================================
-- MIGRATION 3 (OPTIONAL): ORDER NUMBER SEQUENCE & TRIGGER
-- ========================================
-- Run this third ONLY if you want auto-generated order numbers (ORD-000001, etc.)
-- If you don't run this, order numbers must be provided manually or via app logic.

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- Create function to auto-generate order_number on insert
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'ORD-' || LPAD(nextval('order_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to apply function before each insert
DROP TRIGGER IF EXISTS trigger_set_order_number ON public.orders;
CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_number();

-- Verify sequence and function were created (optional):
-- SELECT * FROM information_schema.sequences WHERE sequence_name = 'order_number_seq';
-- SELECT proname FROM pg_proc WHERE proname = 'set_order_number';