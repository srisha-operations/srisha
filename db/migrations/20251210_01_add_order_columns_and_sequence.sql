-- Migration: Add missing columns to orders and order_items, and create sequence + trigger for order numbers

-- add missing columns on orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_address jsonb,
  ADD COLUMN IF NOT EXISTS total_amount numeric;

-- ensure order_number exists
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number text;

-- ensure order_items has unit_price if missing
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS unit_price integer;

-- create sequence for order numbering if not exists
CREATE SEQUENCE IF NOT EXISTS public.order_seq START 1;

-- function to set order_number
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'SO-' || to_char(nextval('public.order_seq'), 'FM00000');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- trigger
DROP TRIGGER IF EXISTS trg_set_order_number ON public.orders;
CREATE TRIGGER trg_set_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_order_number();
