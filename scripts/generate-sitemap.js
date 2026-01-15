/**
 * Generate Sitemap Script
 * Run this before build to generate a complete sitemap including all products.
 * Usage: node scripts/generate-sitemap.js
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load env vars
dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SITE_URL = "https://www.srishabynischithayogesh.com"; // Your live domain

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Error: Supabase environment variables missing.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const generateSitemap = async () => {
  console.log("Generating sitemap...");

  // 1. Static Pages
  const staticPages = [
    "",
    "/products",
    "/about",
    // Add other public static routes here
  ];

  // 2. Fetch Dynamic Pages (Products)
  const { data: products, error } = await supabase
    .from("products")
    .select("slug, updated_at");

  if (error) {
    console.error("Error fetching products:", error);
    process.exit(1);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Pages -->
  ${staticPages
    .map((route) => {
      const url = `${SITE_URL}${route}`;
      return `
  <url>
    <loc>${url}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;
    })
    .join("")}

  <!-- Dynamic Products -->
  ${products
    .map((product) => {
      const url = `${SITE_URL}/product/${product.slug}`;
      const lastMod = product.updated_at ? new Date(product.updated_at).toISOString() : new Date().toISOString();
      return `
  <url>
    <loc>${url}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .join("")}
</urlset>`;

  // 3. Write to public/sitemap.xml
  const publicDir = path.resolve("public");
  if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir);
  }
  
  fs.writeFileSync(path.join(publicDir, "sitemap.xml"), sitemap);
  console.log(`✅ Sitemap generated at ${path.join(publicDir, "sitemap.xml")} with ${products.length} products.`);
};

generateSitemap();
