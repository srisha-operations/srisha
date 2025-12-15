import { supabase } from "@/lib/supabaseClient";

// ----------------------------
// Create Product (Basic Info)
// ----------------------------
export const createProductBasic = async (product: {
  name: string;
  slug: string;
  description: string;
  price: number;
  visible: boolean;
  available: boolean;
}) => {
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      visible: product.visible,
      available: product.available,
    })
    .select("id")
    .single();

  return { data, error };
};

// ----------------------------
// Create Variants
// ----------------------------
export const createProductVariants = async (
  productId: string,
  variants: {
    size: string;
    color: string;
    stock: number;
    visible: boolean;
  }[]
) => {
  if (!variants.length) return { data: null, error: null };

  const payload = variants.map((v) => ({
    product_id: productId,
    size: v.size,
    color: v.color,
    stock: v.stock,
    visible: v.visible,
  }));

  const { data, error } = await supabase
    .from("product_variants")
    .insert(payload)
    .select();

  return { data, error };
};

// ----------------------------
// Upload product image to storage
// ----------------------------
export const uploadProductImageFile = async (file: File, productId: string) => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${productId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("products")
    .upload(fileName, file);

  if (uploadError) return { data: null, error: uploadError };

  const { data: urlData } = supabase.storage
    .from("products")
    .getPublicUrl(fileName);

  return { data: urlData?.publicUrl, error: null };
};

// ----------------------------
// Insert product image metadata
// ----------------------------
export const addProductImageRecord = async ({
  productId,
  url,
  position,
  is_hover,
}: {
  productId: string;
  url: string;
  position: number;
  is_hover: boolean;
}) => {
  const { data, error } = await supabase
    .from("product_images")
    .insert({
      product_id: productId,
      url,
      position,
      is_hover,
    })
    .select()
    .single();

  return { data, error };
};

// ----------------------------
// Fetch product images
// ----------------------------
export const getProductImages = async (productId: string) => {
  const { data, error } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", productId)
    .order("position", { ascending: true });

  return { data, error };
};

// ----------------------------
// Update reorder positions
// ----------------------------
export const saveImageOrder = async (
  productId: string,
  sortedImages: any[]
) => {
  const updates = sortedImages.map((img, index) => ({
    id: img.id,
    position: index,
  }));

  const { data, error } = await supabase.from("product_images").upsert(updates);

  return { data, error };
};

// ----------------------------
// Set one image as hover
// ----------------------------
export const setHoverImage = async (productId: string, imageId: string) => {
  // Reset all hover flags
  await supabase
    .from("product_images")
    .update({ is_hover: false })
    .eq("product_id", productId);

  // Set selected as hover
  const { data, error } = await supabase
    .from("product_images")
    .update({ is_hover: true })
    .eq("id", imageId);

  return { data, error };
};

// ----------------------------
// Delete image (storage + DB)
// ----------------------------
export const deleteProductImage = async (url: string, id: string) => {
  // Extract path used in storage
  const path = url.split("/products/")[1];

  // Delete from storage
  await supabase.storage.from("products").remove([path]);

  // Delete from DB
  const { data, error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", id);

  return { data, error };
};

// ----------------------------
// Fetch full product details
// ----------------------------
export const getProductById = async (productId: string) => {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_variants (*)
    `
    )
    .eq("id", productId)
    .single();

  return { data, error };
};

// ----------------------------
// Update basic product fields
// ----------------------------
export const updateProductBasic = async (
  productId: string,
  payload: {
    name: string;
    slug: string;
    description: string;
    price: number;
    visible: boolean;
    available: boolean;
  }
) => {
  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", productId)
    .select()
    .single();

  return { data, error };
};

// ----------------------------
// Replace all variants for the product
// ----------------------------
export const replaceProductVariants = async (
  productId: string,
  variants: {
    size: string;
    color: string;
    stock: number;
    visible: boolean;
  }[]
) => {
  // delete old variants
  await supabase.from("product_variants").delete().eq("product_id", productId);

  // add fresh variants
  if (variants.length === 0) return { data: null, error: null };

  const payload = variants.map((v) => ({
    product_id: productId,
    size: v.size,
    color: v.color,
    stock: v.stock,
    visible: v.visible,
  }));

  const { data, error } = await supabase
    .from("product_variants")
    .insert(payload)
    .select();

  return { data, error };
};

// ----------------------------
// List products (with images & variants)
// ----------------------------
export const listProducts = async () => {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_images (id, url, is_hover, position),
      product_variants (id, size, color, stock, visible)
    `
    )
    .order("product_id", { ascending: false });

  return { data, error };
};

// ----------------------------
// Delete product (DB + storage cleanup)
// ----------------------------
export const deleteProductById = async (productId: string) => {
  // Fetch product images to remove from storage
  const { data: imagesData } = await supabase
    .from("product_images")
    .select("url")
    .eq("product_id", productId);

  // Delete storage objects (if URLs are from the same bucket)
  try {
    if (imagesData && imagesData.length > 0) {
      const paths: string[] = imagesData
        .map((r: any) => {
          if (!r?.url) return null;
          const idx = r.url.indexOf("/products/");
          return idx === -1 ? null : r.url.slice(idx + 10); // path after '/products/'
        })
        .filter(Boolean) as string[];

      if (paths.length > 0) {
        // Supabase storage remove expects exact object paths
        await supabase.storage.from("products").remove(paths);
      }
    }
  } catch (err) {
    // swallow storage errors but log them
    console.error("Storage delete error", err);
  }

  // Delete product row (cascades to variants/images table rows because of FK)
  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  return { data, error };
};

// ----------------------------
// Toggle product visibility
// ----------------------------
export const toggleProductVisibility = async (
  productId: string,
  visible: boolean
) => {
  const { data, error } = await supabase
    .from("products")
    .update({ visible })
    .eq("id", productId)
    .select()
    .single();

  return { data, error };
};

// ----------------------------
// Add a single variant (for edit page)
// ----------------------------
export const addVariant = async (
  productId: string,
  variant: {
    size: string;
    color: string;
    stock: number;
    visible: boolean;
  }
) => {
  const { data, error } = await supabase
    .from("product_variants")
    .insert({
      product_id: productId,
      size: variant.size,
      color: variant.color,
      stock: variant.stock,
      visible: variant.visible,
    })
    .select()
    .single();

  return { data, error };
};

// ----------------------------
// Update variant by ID
// ----------------------------
export const updateVariant = async (
  variantId: string,
  payload: {
    size?: string;
    color?: string;
    stock?: number;
    visible?: boolean;
  }
) => {
  const { data, error } = await supabase
    .from("product_variants")
    .update(payload)
    .eq("id", variantId)
    .select()
    .single();

  return { data, error };
};

// ----------------------------
// Delete variant by ID
// ----------------------------
export const deleteVariant = async (variantId: string) => {
  const { data, error } = await supabase
    .from("product_variants")
    .delete()
    .eq("id", variantId);

  return { data, error };
};
