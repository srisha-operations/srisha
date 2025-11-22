import { useState } from "react";
import { Dialog, DialogContent, DialogClose } from "./ui/dialog";
import { Button } from "./ui/button";
import { AspectRatio } from "./ui/aspect-ratio";
import { X, Heart } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: string;
  thumbDefault: string;
  thumbHover: string;
  aspectRatio: string;
  wishlist: boolean;
  order: number;
}

interface ProductDetailModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WISHLIST_KEY = "srisha_wishlist";
const INQUIRIES_KEY = "srisha_inquiries";

const ProductDetailModal = ({ product, open, onOpenChange }: ProductDetailModalProps) => {
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [selectedImage, setSelectedImage] = useState<number>(0);
  const [isWishlisted, setIsWishlisted] = useState(false);

  if (!product) return null;

  const images = [product.thumbDefault, product.thumbHover, product.thumbDefault, product.thumbHover];
  const sizes = ["S", "M", "L", "XL", "XXL"];

  const handleWishlistToggle = () => {
    const stored = localStorage.getItem(WISHLIST_KEY);
    const wishlist: string[] = stored ? JSON.parse(stored) : [];
    
    if (isWishlisted) {
      const updated = wishlist.filter((id) => id !== product.id);
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
      setIsWishlisted(false);
    } else {
      wishlist.push(product.id);
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
      setIsWishlisted(true);
    }
    
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  const handleInquire = () => {
    // Add to inquiries
    const stored = localStorage.getItem(INQUIRIES_KEY);
    const inquiries: string[] = stored ? JSON.parse(stored) : [];
    
    if (!inquiries.includes(product.id)) {
      inquiries.push(product.id);
      localStorage.setItem(INQUIRIES_KEY, JSON.stringify(inquiries));
    }

    // Open WhatsApp
    const message = encodeURIComponent(`I would like to inquire about ${product.name} (Size: ${selectedSize})`);
    window.open(`https://wa.me/PHONE_NUMBER?text=${message}`, "_blank");

    // Open cart drawer
    window.dispatchEvent(new Event("openCartDrawer"));
    
    // Close modal
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full h-[90vh] p-0 overflow-hidden bg-background">
        <div className="flex flex-col md:flex-row h-full">
          {/* Left Column - Images */}
          <div className="w-full md:w-1/2 p-6 lg:p-8 flex flex-col gap-4">
            {/* Main Image */}
            <div className="flex-1 bg-muted">
              <AspectRatio ratio={4 / 5}>
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </AspectRatio>
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`bg-muted transition-all ${
                    selectedImage === idx ? "ring-2 ring-foreground" : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <AspectRatio ratio={4 / 5}>
                    <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                  </AspectRatio>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="w-full md:w-1/2 p-6 lg:p-8 overflow-y-auto">
            <DialogClose className="absolute top-4 right-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity">
              <X className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </DialogClose>

            <div className="space-y-6">
              {/* Product Name & Price */}
              <div>
                <h2 className="font-tenor text-3xl lg:text-4xl text-foreground mb-2">
                  {product.name}
                </h2>
                <p className="font-lato text-xl text-muted-foreground">{product.price}</p>
              </div>

              {/* Size Selection */}
              <div>
                <h3 className="font-tenor text-sm tracking-wide mb-3 text-foreground">Select Size</h3>
                <div className="flex gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 border font-lato text-sm transition-all ${
                        selectedSize === size
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <h3 className="font-tenor text-sm tracking-wide mb-3 text-foreground">Color</h3>
                <div className="flex gap-2">
                  <button className="w-10 h-10 rounded-full border-2 border-foreground bg-muted"></button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleWishlistToggle}
                  variant="outline"
                  className="w-full font-tenor tracking-wide"
                >
                  <Heart
                    className={`w-5 h-5 mr-2 transition-all ${
                      isWishlisted ? "fill-current" : ""
                    }`}
                  />
                  {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                </Button>

                <Button onClick={handleInquire} className="w-full font-tenor tracking-wide">
                  Inquire
                </Button>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-tenor text-sm tracking-wide mb-2 text-foreground">Description</h3>
                <p className="font-lato text-sm text-muted-foreground leading-relaxed">
                  Exquisite handcrafted piece featuring intricate detailing and premium fabrics. 
                  Each design is thoughtfully created to blend traditional elegance with contemporary style.
                  Perfect for special occasions and celebrations.
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
