// src/services/cart.ts
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";

const LOCAL_KEY = "srisha_cart";

type CartLine = {
  product_id: string;
  variant_id?: string | null;
  quantity?: number;
  status?: string;
};

export const listCart = async (userId?: string) => {
  if (!userId) {
    const s = localStorage.getItem(LOCAL_KEY);
    return s ? JSON.parse(s) as CartLine[] : [];
  }

  // Add simple cache + cooldown to avoid repeated focus/visibility fetches
  const now = Date.now();
  // module-level cache vars
  if (!(globalThis as any).__srisha_cart_cache) {
    (globalThis as any).__srisha_cart_cache = {
      data: null as any[] | null,
      lastFetch: 0,
      inFlight: null as Promise<any[]> | null,
    };
  }

  const cache = (globalThis as any).__srisha_cart_cache;

  if (cache.inFlight) return cache.inFlight;
  if (now - cache.lastFetch < 15000 && cache.data) return Promise.resolve(cache.data);

  cache.inFlight = (async () => {
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("listCart error", error);
        return [];
      }

      cache.data = data;
      cache.lastFetch = Date.now();
      return data;
    } finally {
      cache.inFlight = null;
    }
  })();

  return cache.inFlight;
};

export const addToCart = async (payload: { product_id: string; variant_id?: string | null; quantity?: number }, userId?: string) => {
  const { product_id, variant_id = null, quantity = 1 } = payload;
  if (!userId) {
    // local
    const s = localStorage.getItem(LOCAL_KEY);
    const arr = s ? JSON.parse(s) as CartLine[] : [];
    const existing = arr.find((i) => i.product_id === product_id && (i.variant_id || null) === variant_id);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + quantity;
    } else {
      arr.push({ product_id, variant_id, quantity, status: "cart" });
    }
    localStorage.setItem(LOCAL_KEY, JSON.stringify(arr));
    // update in-memory cache if present
    try {
      const cache = (globalThis as any).__srisha_cart_cache;
      if (cache) {
        cache.data = arr;
        cache.lastFetch = 0;
      }
    } catch (e) {}
    window.dispatchEvent(new Event("cartUpdated"));
    try { toast({ title: "Added to cart", description: "Item added to your cart." }); } catch (e) {}
    return { success: true };
  }

  // Try upsert: if already exists, update quantity
  // We'll upsert on user_id+product_id+variant_id via unique index
  const inserts = [{
    user_id: userId,
    product_id,
    variant_id,
    quantity,
    status: "cart"
  }];

  const { error } = await supabase.from("cart_items").upsert(inserts, { onConflict: "user_id,product_id,variant_id" }).select();

  if (error) {
    console.error("addToCart error", error);
    return { error };
  }

  // reset remote cache so next listCart fetches fresh data
  try {
    const cache = (globalThis as any).__srisha_cart_cache;
    if (cache) {
      cache.data = null;
      cache.lastFetch = 0;
    }
  } catch (e) {}

  window.dispatchEvent(new Event("cartUpdated"));
  try { toast({ title: "Added to cart", description: "Item added to your cart." }); } catch (e) {}
  return { success: true };
};

export const updateCartQuantity = async (id: string, quantity: number, userId?: string) => {
  if (!userId) {
    const s = localStorage.getItem(LOCAL_KEY);
    const arr = s ? JSON.parse(s) as CartLine[] : [];
    const it = arr.find((i) => (i as any).id === id || (i.product_id === id));
    if (it) {
      it.quantity = quantity;
      localStorage.setItem(LOCAL_KEY, JSON.stringify(arr));
      try { const cache = (globalThis as any).__srisha_cart_cache; if (cache) { cache.data = arr; cache.lastFetch = 0; } } catch(e){}
      window.dispatchEvent(new Event("cartUpdated"));
      try { toast({ title: "Cart updated", description: "Item quantity updated." }); } catch (e) {}
    }
    return { success: true };
  }

  const { error } = await supabase.from("cart_items").update({ quantity, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId);
  if (error) {
    console.error("updateCartQuantity error", error);
    return { error };
  }
  try { const cache = (globalThis as any).__srisha_cart_cache; if (cache) { cache.data = null; cache.lastFetch = 0; } } catch(e){}
  window.dispatchEvent(new Event("cartUpdated"));
  try { toast({ title: "Cart updated", description: "Item quantity updated." }); } catch (e) {}
  return { success: true };
};

export const removeFromCart = async (idOrProductId: string, userId?: string) => {
  if (!userId) {
    const s = localStorage.getItem(LOCAL_KEY);
    const arr = s ? JSON.parse(s) as CartLine[] : [];
    const filtered = arr.filter((i) => i.product_id !== idOrProductId && (i as any).id !== idOrProductId);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(filtered));
    try { const cache = (globalThis as any).__srisha_cart_cache; if (cache) { cache.data = filtered; cache.lastFetch = 0; } } catch(e){}
    window.dispatchEvent(new Event("cartUpdated"));
    try { toast({ title: "Removed from cart", description: "Item removed from your cart." }); } catch (e) {}
    return { success: true };
  }

  const { error } = await supabase.from("cart_items").delete().eq("id", idOrProductId).eq("user_id", userId);
  if (error) {
    console.error("removeFromCart error", error);
    return { error };
  }
  try { const cache = (globalThis as any).__srisha_cart_cache; if (cache) { cache.data = null; cache.lastFetch = 0; } } catch(e){}
  window.dispatchEvent(new Event("cartUpdated"));
  try { toast({ title: "Removed from cart", description: "Item removed from your cart." }); } catch (e) {}
  return { success: true };
};

// Submit preorder (set status => 'inquired') for given user's cart lines (or all)
export const submitPreorder = async (userId: string, itemIds?: string[]) => {
  if (!userId) throw new Error("Missing userId");

  let q = supabase.from("cart_items").update({ status: "inquired", updated_at: new Date().toISOString() }).eq("user_id", userId);

  if (itemIds && itemIds.length) {
    q = q.in("id", itemIds);
  } else {
    // update all rows for this user in status 'cart'
    q = q.eq("status", "cart");
  }

  const { error } = await q;
  if (error) {
    console.error("submitPreorder error", error);
    return { error };
  }

  // optional: return updated rows by selecting
  try { const cache = (globalThis as any).__srisha_cart_cache; if (cache) { cache.data = null; cache.lastFetch = 0; } } catch(e){}
  window.dispatchEvent(new Event("cartUpdated"));
  try { toast({ title: "Preorder submitted", description: "The store will contact you soon." }); } catch (e) {}
  return { success: true };
};

// Merge local cart into remote on login
export const mergeLocalCartToRemote = async (userId: string) => {
  const s = localStorage.getItem(LOCAL_KEY);
  if (!s) return;
  const local = JSON.parse(s) as CartLine[];
  if (!local.length) return;

  // Insert each line (upsert)
  const inserts = local.map((l) => ({
    user_id: userId,
    product_id: l.product_id,
    variant_id: l.variant_id || null,
    quantity: l.quantity || 1,
    status: l.status || "cart"
  }));

  const { error } = await supabase.from("cart_items").upsert(inserts, { onConflict: "user_id,product_id,variant_id" });
  if (error) console.error("mergeLocalCartToRemote error", error);

  localStorage.removeItem(LOCAL_KEY);
  try { const cache = (globalThis as any).__srisha_cart_cache; if (cache) { cache.data = null; cache.lastFetch = 0; } } catch(e){}
  window.dispatchEvent(new Event("cartUpdated"));
  try { toast({ title: "Cart merged", description: "Local cart merged to your account." }); } catch (e) {}
};

export const clearCart = async (userId?: string | null) => {
  try {
    if (!userId) {
      localStorage.removeItem(LOCAL_KEY);
      try { const cache = (globalThis as any).__srisha_cart_cache; if (cache) { cache.data = null; cache.lastFetch = 0; } } catch(e){}
      window.dispatchEvent(new Event("cartUpdated"));
      try { toast({ title: "Cart cleared", description: "Your cart is now empty." }); } catch (e){}
      return { success: true };
    }

    const { error } = await supabase.from("cart_items").delete().eq("user_id", userId);
    if (error) {
      console.error("clearCart error", error);
      return { error };
    }
    try { const cache = (globalThis as any).__srisha_cart_cache; if (cache) { cache.data = null; cache.lastFetch = 0; } } catch(e){}
    window.dispatchEvent(new Event("cartUpdated"));
    try { toast({ title: "Cart cleared", description: "Your cart is now empty." }); } catch (e){}
    return { success: true };
  } catch (e) {
    console.error("clearCart exception", e);
    return { error: e };
  }
};
