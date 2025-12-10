import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { AspectRatio } from "./ui/aspect-ratio";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { Trash2, ShoppingCart } from "lucide-react";

import { listWishlist, removeFromWishlist } from "@/services/wishlist";
import { addToCart } from "@/services/cart";
import { getCurrentUser } from "@/services/auth";
import { supabase } from "@/lib/supabaseClient";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WishlistDrawer = ({ open, onOpenChange }: Props) => {
  const [items, setItems] = useState<any[]>([]);
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({});
  const [cartAdded, setCartAdded] = useState<Record<string, boolean>>({});

  // ---------------------------------------
  // Load wishlist items (guest or user)
  // ---------------------------------------
  const loadWishlist = async () => {
    const user = await getCurrentUser();
    const ids = await listWishlist(user?.id ?? null);

    if (!ids.length) {
      setItems([]);
      return;
    }

    const { data } = await supabase
      .from("products")
      .select("*, product_images(*)")
      .in("id", ids);

    setItems(data || []);
  };

  useEffect(() => {
    if (open) loadWishlist();

    const reload = () => loadWishlist();
    window.addEventListener("wishlistUpdated", reload);

    return () => window.removeEventListener("wishlistUpdated", reload);
  }, [open]);

  // ---------------------------------------
  // Remove item from wishlist
  // ---------------------------------------
  const handleRemove = async (productId: string) => {
    const user = await getCurrentUser();
    const uid = user?.id ?? null;

    try {
      await removeFromWishlist(uid, productId);
      await loadWishlist();
    } catch (err) {
      console.error("remove wishlist failed", err);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full md:w-[400px] lg:w-[500px] bg-background overflow-y-auto"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="font-tenor text-2xl tracking-wide text-foreground">
            Added to Wishlist
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="font-lato text-muted-foreground mb-4">
              Your wishlist is empty
            </p>
            <Link to="/" onClick={() => onOpenChange(false)}>
              <Button variant="outline" className="font-lato">
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((product, index) => {
              const image =
                product.product_images?.[0]?.url ||
                "https://placehold.co/300x400?text=No+Image";

              return (
                <div
                  key={`${product.id}-${index}`}
                  className="flex gap-4 items-start pb-6 border-b border-border last:border-0"
                >
                  <div className="flex-shrink-0 w-8 text-center pt-2">
                    <span className="font-lato text-sm text-muted-foreground">
                      {index + 1}
                    </span>
                  </div>

                  <div className="w-24 flex-shrink-0">
                    <AspectRatio ratio={4 / 5}>
                      <img
                        src={image}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </AspectRatio>
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    <h4 className="font-tenor text-lg text-foreground mb-1 line-clamp-2">
                      {product.name}
                    </h4>
                    <p className="text-base text-muted-foreground">
                      ₹{product.price}
                    </p>
                  </div>

                    <div className="flex-shrink-0 flex gap-2 pt-1 items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          setAddingToCart({ ...addingToCart, [product.id]: true });
                          setCartAdded({ ...cartAdded, [product.id]: true });

                          const user = await getCurrentUser();
                          await addToCart({ product_id: product.id, quantity: 1 }, user?.id);
                          await handleRemove(product.id);
                          window.dispatchEvent(new Event("cartUpdated"));

                          setTimeout(() => {
                            setAddingToCart({ ...addingToCart, [product.id]: false });
                            setCartAdded({ ...cartAdded, [product.id]: false });
                          }, 500);
                        }}
                        aria-label="Move to cart"
                        className={`h-9 w-9 flex items-center justify-center transition-all duration-220 ${
                          addingToCart[product.id] ? "scale-105" : "scale-100"
                        } ${cartAdded[product.id] ? "bg-green-50" : ""}`}
                        aria-live="polite"
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>

                      {/* Remove */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(product.id)}
                        className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                        aria-label="Remove from wishlist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                </div>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default WishlistDrawer;
