-- ========================================
-- SQL Migration Scripts - Quick Start Guide
-- ========================================

Follow these steps to apply all migrations to your Supabase database:

1. Open your Supabase project dashboard
2. Go to SQL Editor (left sidebar)
3. Create a new query
4. Copy and paste the scripts BELOW in order (one script per query execution)
5. Click "Run" after each script

⚠️ IMPORTANT: Run them in this exact order:
   - First: Migration 1 (Add columns to orders)
   - Second: Migration 2 (Create sequence and trigger)
   - Third: Migration 3 (RLS policies for site_content)

========================================

-- MIGRATION 1: Add Missing Columns to Orders Table
-- Copy everything below and run it as a NEW query

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipping_address JSONB DEFAULT NULL;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2) DEFAULT NULL;

-- ========================================

-- MIGRATION 2: Create Order Number Sequence and Trigger
-- Copy everything below and run it as a NEW query (after Migration 1 completes)

CREATE SEQUENCE IF NOT EXISTS order_number_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'ORD-' || LPAD(nextval('order_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_order_number ON orders;
CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- ========================================

-- MIGRATION 3: Enable RLS and Create Admin Access Policy
-- Copy everything below and run it as a NEW query (after Migration 2 completes)

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public to read site_content" ON site_content;
CREATE POLICY "Allow public to read site_content"
  ON site_content
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow admins to modify site_content" ON site_content;
CREATE POLICY "Allow admins to modify site_content"
  ON site_content
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );

-- ========================================

What each migration does:

Migration 1 (add_orders_columns.sql):
- Adds shipping_address (JSONB) to store address details
- Adds total_amount (NUMERIC) for precise order totals
- These columns are needed by the new checkout form

Migration 2 (order_number_sequence.sql):
- Creates auto-incrementing order number sequence (ORD-000001, ORD-000002, etc.)
- Trigger automatically generates order_number when a new order is inserted
- No manual action needed — order numbers are created automatically

Migration 3 (site_content_rls_policy.sql):
- Enables Row Level Security on site_content table
- Anyone can READ site content (public websites, galleries, footer)
- Only admins (users in admins table) can CREATE/UPDATE/DELETE content
- Admins are identified by their auth.users.id being in the admins.id column

After running all three migrations:
1. Go back to your frontend code
2. Run `npm run build` to rebuild the app
3. Test the checkout form — it should now create orders with shipping address
4. Test admin content editing — only admin accounts should be able to modify site_content

If any migration fails, check the error message in Supabase and let me know!