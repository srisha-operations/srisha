// src/components/ProductCard.tsx
import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "./ui/button";
import { AspectRatio } from "./ui/aspect-ratio";
import { listWishlist, addToWishlist, removeFromWishlist } from "@/services/wishlist";
import { addToCart } from "@/services/cart";
import { getCurrentUser } from "@/services/auth";
import { toast } from "@/hooks/use-toast";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

type Product = any;

const placeholder = (w = 800, h = 1000, text = "No image") =>
  `https://placehold.co/${w}x${h}?text=${encodeURIComponent(text)}`;

const formatPrice = (p: number) => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(p);
  } catch {
    return `₹${p}`;
  }
};

interface Props {
  product: Product;
  onProductClick?: (p: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (e?: any) => void;
  // optional override for primary action in listing
  primaryActionLabel?: string;
  primaryActionHandler?: (e?: any) => void;
  showWhatsApp?: boolean;
}

const ProductCard = ({
  product,
  onProductClick,
  isWishlisted: isWishlistedProp,
  onToggleWishlist: onToggleWishlistProp,
  primaryActionLabel,
  primaryActionHandler,
  showWhatsApp = true,
}: Props) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (typeof isWishlistedProp !== "undefined") {
        if (mounted) setIsWishlisted(isWishlistedProp as boolean);
        return;
      }

      const user = await getCurrentUser();
      const ids = await listWishlist(user?.id ?? null);
      if (mounted) setIsWishlisted(ids.includes(product.id));
    })();

    return () => {
      mounted = false;
    };
  }, [product.id, isWishlistedProp]);

  useEffect(() => {
    const onUpdated = async () => {
      const user = await getCurrentUser();
      const ids = await listWishlist(user?.id ?? null);
      setIsWishlisted(ids.includes(product.id));
    };

    window.addEventListener("wishlistUpdated", onUpdated);
    return () => window.removeEventListener("wishlistUpdated", onUpdated);
  }, [product.id]);

  const images = product?.product_images || [];
  const sorted = [...images].sort(
    (a: any, b: any) => (a?.position ?? 0) - (b?.position ?? 0)
  );
  const thumbDefault =
    sorted.find((i: any) => !i?.is_hover)?.url ??
    sorted[0]?.url ??
    placeholder(800, 1000, "Product");
  const thumbHover =
    sorted.find((i: any) => i?.is_hover)?.url ?? sorted[1]?.url ?? thumbDefault;

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleWishlistProp) {
      await onToggleWishlistProp();
      return;
    }

    const user = await getCurrentUser();
    const uid = user?.id ?? null;

    // Optimistic UI
    const prev = isWishlisted;
    setIsWishlisted(!prev);

    try {
      if (prev) {
        await removeFromWishlist(uid, product.id);
      } else {
        await addToWishlist(uid, product.id);
      }
      // Event emitted by service on success
    } catch (err) {
      // Revert optimistic update
      setIsWishlisted(prev);
      console.error("wishlist toggle failed", err);
      toast({ title: "Could not update wishlist", description: "Please try again." });
    }
  };

  const handleInquire = async () => {
    // add to cart as inquiry placeholder for now (local behavior)
    const user = await getCurrentUser();
    
    // Trigger animation
    setIsAddingToCart(true);
    setCartAdded(true);

    await addToCart({ product_id: product.id }, user?.id);
    if (!user) {
      window.dispatchEvent(new CustomEvent("openAuthModal", { detail: "signin" }));
    }
    // optionally open WhatsApp only when enabled
    if (showWhatsApp) {
      const msg = encodeURIComponent(`I would like to inquire about ${product.name}`);
      window.open(`https://wa.me/PHONE_NUMBER?text=${msg}`, "_blank");
    }
    window.dispatchEvent(new Event("cartUpdated"));

    // End animation after 500ms
    setTimeout(() => {
      setIsAddingToCart(false);
      setCartAdded(false);
    }, 500);
  };

  // If guest added to cart, prompt sign-in modal but still add to cart (handled by service)
  useEffect(() => {
    // no-op placeholder to keep consistent behavior across components
  }, []);

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onProductClick?.(product);
  };

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative overflow-hidden bg-muted mb-4 cursor-pointer"
        onClick={handleView}
      >
        <AspectRatio ratio={4 / 5}>
          <img
            src={isHovered ? thumbHover : thumbDefault}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center transition-all duration-200"
          />
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-3 right-3 z-20 w-10 h-10 flex items-center justify-center bg-background/80 backdrop-blur-sm ${
              isHovered ? "hover:scale-110" : ""
            }`}
            aria-label="Add to wishlist"
          >
            <Heart
              className={`w-5 h-5 ${
                isWishlisted ? "fill-accent text-accent" : "text-foreground"
              }`}
            />
          </button>

          <div
            className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/90 to-transparent p-6 transition-all duration-200 ${
              isHovered
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            <Button
              onClick={handleView}
              variant="outline"
              className="w-full bg-background/10 border-background/40 text-background hover:bg-background hover:text-foreground"
            >
              View Details
            </Button>
          </div>
        </AspectRatio>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="font-tenor text-lg md:text-xl text-foreground">
            {product.name}
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            {formatPrice(product.price)}
          </p>
        </div>

        <Button
          onClick={primaryActionHandler ? async () => {
            setIsAddingToCart(true);
            setCartAdded(true);
            await primaryActionHandler?.();
            setTimeout(() => {
              setIsAddingToCart(false);
              setCartAdded(false);
            }, 500);
          } : handleInquire}
          variant="outline"
          className={`w-full gap-2 hover:bg-secondary transition-all duration-220 ${
            isAddingToCart ? "scale-108" : "scale-100"
          } ${cartAdded ? "bg-green-50" : ""}`}
          aria-live="polite"
        >
          {cartAdded ? (
            <>
              <span className="text-green-600">✓</span>
              Added
            </>
          ) : (
            primaryActionLabel ? primaryActionLabel : (showWhatsApp ? <><WhatsAppIcon className="w-4 h-4" /> Inquire</> : "ADD TO CART")
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;
