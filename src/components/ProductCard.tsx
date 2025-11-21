import { useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { Button } from "./ui/button";
import { AspectRatio } from "./ui/aspect-ratio";

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
    const message = encodeURIComponent(`I want to know more about ${product.name}`);
    window.open(`https://wa.me/?text=${message}`, "_blank");
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
            className="w-full h-full object-cover object-center transition-opacity duration-200"
          />
          
          {/* Wishlist Heart */}
          <button
            onClick={onToggleWishlist}
            className="absolute top-3 right-3 z-20 w-10 h-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
            aria-label="Add to wishlist"
          >
            <Heart
              className={`w-5 h-5 transition-all duration-200 ${
                isWishlisted
                  ? "fill-[#D4AF37] text-[#D4AF37]"
                  : "text-foreground"
              }`}
            />
          </button>

          {/* View Details Overlay (Desktop Hover) */}
          <div
            className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/90 to-transparent p-6 transition-opacity duration-200 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          >
            <Button
              variant="outline"
              className="w-full bg-background/10 border-background/40 text-background hover:bg-background hover:text-foreground backdrop-blur-sm"
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
          className="w-full gap-2 hover:bg-muted"
        >
          <MessageCircle className="w-4 h-4" />
          Inquire
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;
