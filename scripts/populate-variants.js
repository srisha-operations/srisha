
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("Starting variant population...");

  // 1. Read .env.local manually
  let envContent = '';
  try {
    envContent = fs.readFileSync(path.resolve(__dirname, '../.env.local'), 'utf8');
  } catch (e) {
    console.error("Could not read .env.local", e.message);
    process.exit(1);
  }

  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return match ? match[1].trim() : null;
  };

  const url = getEnv('VITE_SUPABASE_URL');
  let key = getEnv('SUPABASE_SERVICE_ROLE_KEY'); // Prefer service role for admin tasks
  if (!key) {
      console.warn("SUPABASE_SERVICE_ROLE_KEY not found in .env.local, trying VITE_SUPABASE_ANON_KEY...");
      key = getEnv('VITE_SUPABASE_ANON_KEY');
  }

  if (!url || !key) {
    console.error("Missing Supabase URL or Key in .env.local");
    console.log("URL found:", !!url, "Key found:", !!key);
    process.exit(1);
  }

  const supabase = createClient(url, key);

  // 2. Fetch all products
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, name');

  if (prodError) {
    console.error("Error fetching products:", prodError);
    process.exit(1);
  }

  console.log(`Found ${products.length} products.`);

  // 3. Insert variants
  const sizes = ['S', 'M', 'L', 'XL'];
  let totalInserted = 0;

  for (const p of products) {
    // Check existing variants
    const { data: existing } = await supabase
      .from('product_variants')
      .select('id')
      .eq('product_id', p.id);

    if (existing && existing.length > 0) {
      console.log(`Skipping ${p.name} (id: ${p.id}) - already has ${existing.length} variants.`);
      continue;
    }

    console.log(`Processing ${p.name}...`);
    const variants = sizes.map(size => ({
      product_id: p.id,
      size: size,
      stock: 50, // Default stock
      visible: true
    }));

    const { error: insertError } = await supabase
      .from('product_variants')
      .insert(variants);

    if (insertError) {
      console.error(`Failed to insert variants for ${p.name}:`, insertError.message);
    } else {
      totalInserted += variants.length;
      console.log(`  Inserted ${variants.length} variants for ${p.name}`);
    }
  }

  console.log(`Done! Total variants inserted: ${totalInserted}`);
}

main();
