// src/components/ProductDetailModal.tsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { listWishlist, addToWishlist, removeFromWishlist } from "@/services/wishlist";
import { addToCart, submitPreorder } from "@/services/cart";
import { getCurrentUser } from "@/services/auth";
import { toast } from "@/hooks/use-toast";

const ProductDetailModal = ({ product, open, onOpenChange }: any) => {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [shopMode, setShopMode] = useState<"normal" | "inquiry">("normal");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);

  useEffect(() => {
    // load shop mode
    // fetch wishlist status
    (async () => {
      if (product && open) {
        const user = await getCurrentUser();
        const ids = await listWishlist(user?.id ?? null);
        setIsWishlisted(ids.includes(product.id));
      }
    })();
  }, [product, open]);

  useEffect(() => {
    const onUpdated = async () => {
      if (!product) return;
      const user = await getCurrentUser();
      const ids = await listWishlist(user?.id ?? null);
      setIsWishlisted(ids.includes(product.id));
    };

    window.addEventListener("wishlistUpdated", onUpdated);
    return () => window.removeEventListener("wishlistUpdated", onUpdated);
  }, [product]);
  useEffect(() => {
    if (product && open) {
      const imgs = (product.product_images || [])
        .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
        .map((i: any) => i.url);
      setSelectedImage(imgs[0] || "");
      setCurrentImageIndex(0);
      setSelectedSize("");
    }
  }, [product, open]);

  const handleWishlistToggle = async () => {
    const user = await getCurrentUser();
    const uid = user?.id ?? null;

    if (!user) {
      // For guests, we still allow local wishlist but encourage sign-in
      // Optimistic update
      const prev = isWishlisted;
      setIsWishlisted(!prev);
      try {
        if (prev) {
          await removeFromWishlist(uid, product.id);
        } else {
          await addToWishlist(uid, product.id);
        }
      } catch (err) {
        setIsWishlisted(prev);
        console.error("guest wishlist toggle failed", err);
        toast({ title: "Could not update wishlist", description: "Please try again." });
      }
      return;
    }

    // Authenticated users: optimistic update
    const prev = isWishlisted;
    setIsWishlisted(!prev);
    try {
      if (prev) {
        await removeFromWishlist(uid, product.id);
      } else {
        await addToWishlist(uid, product.id);
      }
    } catch (err) {
      setIsWishlisted(prev);
      console.error("wishlist toggle failed", err);
      toast({ title: "Could not update wishlist", description: "Please try again." });
    }
  };

  const handleAddToCart = async () => {
    const user = await getCurrentUser();

    // Trigger animation
    setIsAddingToCart(true);
    setCartAdded(true);

    // Always add to cart (local for guests). If guest, also prompt auth modal.
    await addToCart({ product_id: product.id, variant_id: null, quantity: 1 }, user?.id);
    window.dispatchEvent(new Event("cartUpdated"));

    if (!user) {
      // Encourage signing in/up but do not block adding to cart
      window.dispatchEvent(new CustomEvent("openAuthModal", { detail: "signin" }));
    }

    // End animation after 500ms then close
    setTimeout(() => {
      setIsAddingToCart(false);
      setCartAdded(false);
      onOpenChange(false);
    }, 500);
  };

  const handlePreorderOrCheckout = async () => {
    const user = await getCurrentUser();
    if (!user) {
      window.dispatchEvent(
        new CustomEvent("openAuthModal", { detail: "signin" })
      );
      onOpenChange(false);
      return;
    }

    // Decide shop mode by reading site_content 'shop_settings'
    const { data: settings, error } = await (
      await import("@/lib/supabaseClient")
    ).supabase
      .from("site_content")
      .select("value")
      .eq("key", "shop_settings")
      .single();

    const mode = settings?.value?.mode || "normal";

    if (mode === "inquiry") {
      // set cart_items status -> 'inquired' for this user's relevant items
      // add the item if not already in cart, then submit preorder for that product
      await addToCart({ product_id: product.id, quantity: 1 }, user.id);
      await submitPreorder(user.id); // marks all cart items for user as 'inquired'
      toast({ title: "Preorder submitted!", description: "The store will contact you soon." });
      window.dispatchEvent(new Event("cartUpdated"));
      onOpenChange(false);
      return;
    }

    // mode === normal -> add to cart and open CartDrawer
    await addToCart({ product_id: product.id, quantity: 1 }, user.id);
    window.dispatchEvent(new Event("cartUpdated"));
    // Open cart drawer
    window.dispatchEvent(new Event("openCartDrawer"));
    onOpenChange(false);
  };

  if (!product) return null;

  const sizes = Array.from(
    new Set(
      (product.product_variants || []).map((v: any) => v.size).filter(Boolean)
    )
  ) as string[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-[1200px] max-h-[95vh] p-0 overflow-hidden">
        <DialogClose className="absolute right-4 top-4 z-50">
          <X className="h-5 w-5" />
        </DialogClose>

        <div className="overflow-y-auto max-h-[95vh]">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-4 lg:p-8">
              <div className="w-full mb-4">
                <div className="relative w-full bg-muted flex items-center justify-center">
                  <img
                    src={selectedImage}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full max-h-[60vh] object-contain"
                  />

                  {/* left/right arrows */}
                  {product.product_images?.length > 1 && (
                    <>
                      <button
                        onClick={() => {
                          const next = (currentImageIndex - 1 + (product.product_images?.length || 1)) % (product.product_images?.length || 1);
                          setCurrentImageIndex(next);
                          setSelectedImage(product.product_images[next].url);
                        }}
                        aria-label="Previous image"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 p-2 rounded-full hover:bg-background"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>

                      <button
                        onClick={() => {
                          const next = (currentImageIndex + 1) % (product.product_images?.length || 1);
                          setCurrentImageIndex(next);
                          setSelectedImage(product.product_images[next].url);
                        }}
                        aria-label="Next image"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 p-2 rounded-full hover:bg-background"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    </>
                  )}
                </div>

                {/* thumbnails always visible */}
                {product.product_images?.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                    {product.product_images.map((img: any, idx: number) => (
                      <button
                        key={idx}
                        aria-label={`Thumbnail ${idx + 1}`}
                        onClick={() => {
                          setSelectedImage(img.url);
                          setCurrentImageIndex(idx);
                        }}
                        className={cn(
                          "w-20 h-24 flex-shrink-0 border-2 overflow-hidden",
                          currentImageIndex === idx ? "border-primary" : "border-transparent"
                        )}
                      >
                        <img src={img.url} alt={`Thumbnail ${idx + 1}`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 lg:p-8">
              <h2 className="text-2xl font-tenor mb-2">{product.name}</h2>
              <p className="text-xl mb-6">{formatPrice(product.price)}</p>

              <div className="mb-6">
                <label className="text-sm text-muted-foreground block mb-3">
                  SELECT SIZE
                </label>
                <div className="flex gap-2 flex-wrap">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={cn(
                        "px-4 py-2 border",
                        selectedSize === s
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mb-8">
                <Button
                  variant="outline"
                  onClick={handleWishlistToggle}
                  className="flex-1"
                >
                  {" "}
                  <Heart className="w-4 h-4 mr-2" /> WISHLIST{" "}
                </Button>
                <Button
                  onClick={handleAddToCart}
                  className={`flex-1 bg-primary text-primary-foreground transition-all duration-220 ${
                    isAddingToCart ? "scale-108" : "scale-100"
                  } ${cartAdded ? "bg-green-600" : ""}`}
                  aria-live="polite"
                >
                  {cartAdded ? "✓ Added" : "ADD TO CART"}
                </Button>
              </div>

              <div className="flex gap-3 mb-8">
                <Button
                  onClick={handlePreorderOrCheckout}
                  className="w-full bg-secondary"
                >
                  PROCEED TO CART
                </Button>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-sm font-tenor text-foreground mb-3">
                  DESCRIPTION
                </h3>
                <p className="text-sm text-muted-foreground">
                  {product.description || "No description available."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal;
