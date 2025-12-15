-- seed-product-variants.sql
-- This file helps seed product variants for a product in development.
-- Replace <PRODUCT_ID> with your product ID and remove rows that don't apply.

-- Example: Insert sizes S, M, L with stock
INSERT INTO product_variants (product_id, size, color, stock, visible)
VALUES
  ('<PRODUCT_ID>', 'S', 'Default', 10, true),
  ('<PRODUCT_ID>', 'M', 'Default', 10, true),
  ('<PRODUCT_ID>', 'L', 'Default', 10, true),
  ('<PRODUCT_ID>', 'XL', 'Default', 5, true);

-- Optional: Confirm
SELECT * FROM product_variants WHERE product_id = '<PRODUCT_ID>' ORDER BY size;
