import { useState, useEffect, useRef } from "react";
import ProductCard from "./ProductCard";
import ProductDetailModal from "./ProductDetailModal";
import { Button } from "./ui/button";
import productsData from "@/data/products.json";
import { Link } from "react-router-dom";

// localStorage key: srisha_wishlist
const WISHLIST_KEY = "srisha_wishlist";

const ProductListingSection = () => {
  const [wishlistState, setWishlistState] = useState<Record<string, boolean>>({});
  const [isHovered, setIsHovered] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<typeof productsData.products[0] | null>(null);
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

    window.addEventListener("openProductModal", handleOpenProductModal as EventListener);
    return () => window.removeEventListener("openProductModal", handleOpenProductModal as EventListener);
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

  const handleProductClick = (product: typeof productsData.products[0]) => {
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
        if (scrollPosition >= scrollContainer.scrollWidth / 2) {
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
          {/* Left shadow gradient */}
          <div className="hidden md:block absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" />
          
          {/* Scrollable container */}
          <div 
            ref={scrollRef}
            className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div className="flex gap-5 md:gap-8">
              {/* Duplicate products for seamless loop on desktop */}
              {[...productsData.products, ...productsData.products].map((product, index) => (
                <div
                  key={`${product.id}-${index}`}
                  className="w-[45vw] md:w-[22vw] flex-shrink-0"
                >
                  <ProductCard
                    product={product}
                    isWishlisted={wishlistState[product.id] || false}
                    onToggleWishlist={() => toggleWishlist(product.id)}
                    onProductClick={handleProductClick}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right shadow gradient */}
          <div className="hidden md:block absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" />
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
