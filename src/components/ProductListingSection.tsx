import { useState, useEffect, useRef } from "react";
import ProductCard from "./ProductCard";
import ProductDetailModal from "./ProductDetailModal";
import { Button } from "./ui/button";
import { supabase } from "@/lib/supabaseClient";
import { Link } from "react-router-dom";

// localStorage key: srisha_wishlist
const WISHLIST_KEY = "srisha_wishlist";

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
    ...p, // keep full object so modal can still use variants/images if needed
    thumbDefault: defaultImg,
    thumbHover: hoverImg,
  };
};

const ProductListingSection = () => {
  const [wishlistState, setWishlistState] = useState<Record<string, boolean>>(
    {}
  );
  const [isHovered, setIsHovered] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(WISHLIST_KEY);
    if (stored) {
      try {
        const wishlistIds: string[] = JSON.parse(stored);
        const wishlistObj: Record<string, boolean> = {};
        wishlistIds.forEach((id) => {
          wishlistObj[id] = true;
        });
        setWishlistState(wishlistObj);
      } catch {
        setWishlistState({});
      }
    }

    // Listen for product modal open from search
    const handleOpenProductModal = (e: any) => {
      setSelectedProduct(e.detail);
      setIsModalOpen(true);
    };

    window.addEventListener(
      "openProductModal",
      handleOpenProductModal as EventListener
    );
    return () =>
      window.removeEventListener(
        "openProductModal",
        handleOpenProductModal as EventListener
      );
  }, []);

  const toggleWishlist = (id: string) => {
    setWishlistState((prev) => {
      const newState = {
        ...prev,
        [id]: !prev[id],
      };

      // Save to localStorage
      const wishlistIds = Object.keys(newState).filter((key) => newState[key]);
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlistIds));

      return newState;
    });
  };

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

  // Auto-scroll functionality
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollPosition = 0;
    const scrollSpeed = 0.5; // pixels per frame

    const autoScroll = () => {
      if (!isHovered && scrollContainer) {
        scrollPosition += scrollSpeed;

        // Reset scroll when reaching end for seamless loop
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

    // Only auto-scroll on desktop
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

  return (
    <section id="product-listing" className="w-full bg-background py-[100px]">
      <div className="px-8 lg:px-16 xl:px-24">
        {/* Title */}
        <h2 className="font-tenor text-4xl lg:text-5xl text-center text-foreground mb-12 tracking-wide">
          Collections
        </h2>

        {/* Horizontal Scrollable Product Grid */}
        <div
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Scrollable container */}
          <div
            ref={scrollRef}
            className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <div className="flex gap-5 md:gap-8">
              {/* Duplicate products for seamless loop on desktop */}
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
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* View All CTA */}
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
