// src/components/ProductListingSection.tsx
import { useState, useEffect, useRef } from "react";
import ProductCard from "./ProductCard";
import ProductDetailModal from "./ProductDetailModal";
import { Button } from "./ui/button";
import { supabase } from "@/lib/supabaseClient";
import { Link } from "react-router-dom";

import { listWishlist, addToWishlist, removeFromWishlist } from "@/services/wishlist";
import { getCurrentUser } from "@/services/auth";
import { addToCart } from "@/services/cart";

const mapProductForCard = (p: any) => {
  const images = p.product_images || [];
  const sorted = [...images].sort(
    (a: any, b: any) => (a.position ?? 0) - (b.position ?? 0)
  );
  const defaultImg =
    sorted.find((i: any) => !i?.is_hover)?.url || sorted[0]?.url || "";
  const hoverImg =
    sorted.find((i: any) => i?.is_hover)?.url || sorted[1]?.url || defaultImg;

  return {
    ...p,
    thumbDefault: defaultImg,
    thumbHover: hoverImg,
  };
};

const ProductListingSection = () => {
  const [wishlistState, setWishlistState] = useState<Record<string, boolean>>({});
  const [isHovered, setIsHovered] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // -------------------------------
  // Load wishlist from Supabase
  // -------------------------------
  useEffect(() => {
    let mounted = true;

    (async () => {
      const user = await getCurrentUser();
      const ids = await listWishlist(user?.id ?? null);
      if (!mounted) return;

      const obj: Record<string, boolean> = {};
      ids.forEach((id) => (obj[id] = true));
      setWishlistState(obj);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // -------------------------------
  // Toggle Wishlist via Supabase
  // -------------------------------
  const toggleWishlist = async (productId: string) => {
    const user = await getCurrentUser();
    const uid = user?.id ?? null;

    const prev = !!wishlistState[productId];
    // optimistic
    setWishlistState((s) => ({ ...s, [productId]: !prev }));

    try {
      if (prev) {
        await removeFromWishlist(uid, productId);
      } else {
        await addToWishlist(uid, productId);
      }
      // service will emit wishlistUpdated
    } catch (err) {
      console.error("toggleWishlist failed", err);
      // revert
      setWishlistState((s) => ({ ...s, [productId]: prev }));
      // notify user
      const { toast } = await import("@/hooks/use-toast");
      toast({ title: "Could not update wishlist" });
    }
  };

  // -------------------------------
  // Load products
  // -------------------------------
  useEffect(() => {
    const loadProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
        *,
        product_images (*),
        product_variants (*)
      `
        )
        .order("product_id", { ascending: false });

      if (!error && data) {
        const mapped = data.map((p) => {
          const defaultImg = p.product_images?.find((img) => !img.is_hover);
          const hoverImg = p.product_images?.find((img) => img.is_hover);

          return {
            ...p,
            thumbDefault: defaultImg?.url || "",
            thumbHover: hoverImg?.url || defaultImg?.url || "",
          };
        });

        setProducts(mapped);
      }
    };

    loadProducts();
  }, []);

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // -------------------------------
  // Auto-scroll animation
  // -------------------------------
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollPosition = 0;
    const scrollSpeed = 0.5;

    const autoScroll = () => {
      if (!isHovered && scrollContainer) {
        scrollPosition += scrollSpeed;

        if (
          scrollPosition >=
          scrollContainer.scrollWidth - scrollContainer.clientWidth
        ) {
          scrollPosition = 0;
        }

        scrollContainer.scrollLeft = scrollPosition;
      }
      animationRef.current = requestAnimationFrame(autoScroll);
    };

    const isDesktop = window.innerWidth > 768;
    if (isDesktop) {
      animationRef.current = requestAnimationFrame(autoScroll);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isHovered]);

  // -------------------------------
  // UI Rendering
  // -------------------------------
  return (
    <section id="product-listing" className="w-full bg-background py-[30px]">
      <div className="px-8 lg:px-16 xl:px-24">
        <h2 className="font-tenor text-4xl lg:text-5xl text-center text-foreground mb-12 tracking-wide">
          Collections
        </h2>

        <div
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
            <div
            ref={scrollRef}
            className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide"
            
            
            
          >
            <div className="flex gap-5 md:gap-8">
              {products.map((product, index) => (
                <div
                  key={`${product.id}-${index}`}
                  className="w-[45vw] md:w-[22vw] flex-shrink-0"
                >
                  <ProductCard
                    product={mapProductForCard(product)}
                    isWishlisted={wishlistState[product.id] || false}
                    onToggleWishlist={() => toggleWishlist(product.id)}
                    onProductClick={handleProductClick}
                    primaryActionLabel="ADD TO CART"
                    primaryActionHandler={async () => {
                      const user = await getCurrentUser();
                      await addToCart({ product_id: product.id, quantity: 1 }, user?.id);
                      window.dispatchEvent(new Event("cartUpdated"));
                      // If guest, prompt sign in
                      if (!user) window.dispatchEvent(new CustomEvent("openAuthModal", { detail: "signin" }));
                    }}
                    showWhatsApp={false}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-12">
          <Link to="/products">
            <Button
              variant="outline"
              className="px-8 py-6 text-base font-tenor tracking-wide hover:bg-muted"
            >
              VIEW ALL
            </Button>
          </Link>
        </div>
      </div>

      <ProductDetailModal
        product={selectedProduct}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </section>
  );
};

export default ProductListingSection;
