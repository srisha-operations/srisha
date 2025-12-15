// src/services/wishlist.ts
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";

/**
 * Wishlist service
 * - Provides cached listWishlist with cooldown
 * - Handles guest localStorage fallback
 * - Emits `wishlistUpdated` event on changes
 */
export type WishlistRow = {
  user_id: string;
  product_id: string;
};

let wishlistCache: string[] = [];
let lastWishlistFetch = 0;
let inFlightWishlistFetch: Promise<string[]> | null = null;

export const listWishlist = async (userId?: string | null): Promise<string[]> => {
  // Guest: return cached localStorage list
  if (!userId) {
    try {
      const stored = localStorage.getItem("srisha_wishlist");
      const parsed = stored ? JSON.parse(stored) : [];
      wishlistCache = Array.isArray(parsed) ? parsed : [];
      return wishlistCache;
    } catch (err) {
      console.error("listWishlist local parse error", err);
      return [];
    }
  }

  const now = Date.now();
  // if there's an in-flight request, return it
  if (inFlightWishlistFetch) return inFlightWishlistFetch;
  // cooldown: return cache if fresh
  if (now - lastWishlistFetch < 15000 && wishlistCache.length) {
    return Promise.resolve(wishlistCache);
  }

  inFlightWishlistFetch = (async () => {
    try {
      const { data, error } = await supabase
        .from("wishlists")
        .select("product_id")
        .eq("user_id", userId);

      if (error) {
        console.error("listWishlist error", error);
        const stored = localStorage.getItem("srisha_wishlist");
        wishlistCache = stored ? JSON.parse(stored) : [];
      } else {
        wishlistCache = (data || []).map((r: any) => r.product_id);
      }
      lastWishlistFetch = Date.now();
      return wishlistCache;
    } finally {
      inFlightWishlistFetch = null;
    }
  })();

  return inFlightWishlistFetch;
};

export const listWishlistItems = listWishlist;
export const getWishlist = listWishlist;

export const addWishlistItem = async (
  userId: string | null,
  productId: string
): Promise<void> => {
  // Guest: update localStorage
  if (!userId) {
    try {
      const stored = localStorage.getItem("srisha_wishlist");
      const arr = stored ? JSON.parse(stored) : [];
      if (!arr.includes(productId)) {
        arr.push(productId);
        localStorage.setItem("srisha_wishlist", JSON.stringify(arr));
        wishlistCache = arr;
        // update UI and notify
        window.dispatchEvent(new Event("wishlistUpdated"));
        try {
          toast({ title: "Added to wishlist", description: "Item added to your wishlist." });
        } catch (e) {
          // ignore toast errors
        }
      }
      return;
    } catch (err) {
      console.error("addWishlistItem local error", err);
      throw err;
    }
  }

  // Authenticated: upsert to DB
  const { error } = await supabase.from("wishlists").upsert({
    user_id: userId,
    product_id: productId,
  });

  if (error) throw error;
  // update cache and emit
  lastWishlistFetch = 0;
  wishlistCache = wishlistCache.includes(productId) ? wishlistCache : [...wishlistCache, productId];
  window.dispatchEvent(new Event("wishlistUpdated"));
  try {
    toast({ title: "Added to wishlist", description: "Item added to your wishlist." });
  } catch (e) {}
};

export const addToWishlist = addWishlistItem;

export const removeWishlistItem = async (
  userId: string | null,
  productId: string
): Promise<void> => {
  // Guest: remove from localStorage
  if (!userId) {
    try {
      const stored = localStorage.getItem("srisha_wishlist");
      const arr = stored ? JSON.parse(stored) : [];
      const filtered = arr.filter((id: string) => id !== productId);
      localStorage.setItem("srisha_wishlist", JSON.stringify(filtered));
      wishlistCache = filtered;
      window.dispatchEvent(new Event("wishlistUpdated"));
      try {
        toast({ title: "Removed from wishlist", description: "Item removed from your wishlist." });
      } catch (e) {}
      return;
    } catch (err) {
      console.error("removeWishlistItem local error", err);
      throw err;
    }
  }

  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);

  if (error) throw error;
  wishlistCache = wishlistCache.filter((id) => id !== productId);
  lastWishlistFetch = 0;
  window.dispatchEvent(new Event("wishlistUpdated"));
  try {
    toast({ title: "Removed from wishlist", description: "Item removed from your wishlist." });
  } catch (e) {}
};

export const removeFromWishlist = removeWishlistItem;

export default {
  listWishlist,
  listWishlistItems,
  getWishlist,
  addWishlistItem,
  addToWishlist,
  removeWishlistItem,
  removeFromWishlist,
};
