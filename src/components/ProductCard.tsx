import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "./ui/button";
import { AspectRatio } from "./ui/aspect-ratio";

// WhatsApp icon component
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

interface Product {
  id: string;
  name: string;
  price: string;
  thumbDefault: string;
  thumbHover: string;
}

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
}

const ProductCard = ({ product, isWishlisted, onToggleWishlist }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleInquire = () => {
    // Add to inquiries localStorage
    const INQUIRIES_KEY = "srisha_inquiries";
    const stored = localStorage.getItem(INQUIRIES_KEY);
    let inquiries: string[] = [];
    
    if (stored) {
      try {
        inquiries = JSON.parse(stored);
      } catch {
        inquiries = [];
      }
    }
    
    if (!inquiries.includes(product.id)) {
      inquiries.push(product.id);
      localStorage.setItem(INQUIRIES_KEY, JSON.stringify(inquiries));
    }

    // Open WhatsApp
    const message = encodeURIComponent(`I would like to inquire about ${product.name}`);
    window.open(`https://wa.me/PHONE_NUMBER?text=${message}`, "_blank");
    
    // Dispatch event to open cart drawer
    window.dispatchEvent(new CustomEvent("openCartDrawer"));
  };

  return (
    <div 
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden bg-muted mb-4">
        <AspectRatio ratio={4/5}>
          <img
            src={isHovered ? product.thumbHover : product.thumbDefault}
            alt={product.name}
            className="w-full h-full object-cover object-center transition-all duration-200"
            style={{
              transitionProperty: 'opacity, transform',
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
          
          {/* Wishlist Heart */}
          <button
            onClick={onToggleWishlist}
            className={`absolute top-3 right-3 z-20 w-10 h-10 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-200 ${
              isHovered ? "hover:scale-110" : ""
            }`}
            aria-label="Add to wishlist"
            style={{
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <Heart
              className={`w-5 h-5 transition-all duration-200 ${
                isWishlisted
                  ? "fill-accent text-accent"
                  : "text-foreground"
              } ${isHovered ? "scale-110" : ""}`}
              style={{
                transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          </button>

          {/* View Details Overlay (Desktop Hover) */}
          <div
            className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/90 to-transparent p-6 transition-all duration-200 ${
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <Button
              variant="outline"
              className="w-full bg-background/10 border-background/40 text-background hover:bg-background hover:text-foreground backdrop-blur-sm transition-all duration-150"
            >
              View Details
            </Button>
          </div>
        </AspectRatio>
      </div>

      {/* Product Info */}
      <div className="space-y-3">
        <div>
          <h3 className="font-tenor text-lg md:text-xl text-foreground">
            {product.name}
          </h3>
          <p className="text-muted-foreground text-sm mt-1">{product.price}</p>
        </div>

        {/* Inquire Button */}
        <Button
          onClick={handleInquire}
          variant="outline"
          className="w-full gap-2 hover:bg-secondary transition-all duration-150"
          style={{
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <WhatsAppIcon className="w-4 h-4" />
          Inquire
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;
