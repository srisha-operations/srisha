import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  price: string;
  thumbDefault: string;
  thumbHover?: string;
  images?: string[];
  wishlist: boolean;
}

interface ProductDetailModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProductDetailModal = ({ product, open, onOpenChange }: ProductDetailModalProps) => {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const sizes = ["S", "M", "L", "XL", "XXL"];
  const allImages = product?.images || [product?.thumbDefault, product?.thumbHover].filter(Boolean) as string[];

  useEffect(() => {
    if (product && open) {
      setSelectedImage(product.thumbDefault);
      setCurrentImageIndex(0);
      setSelectedSize("");
      
      // Load wishlist status
      const wishlistData = localStorage.getItem("srisha_wishlist");
      if (wishlistData) {
        const wishlist = JSON.parse(wishlistData);
        setIsWishlisted(wishlist.includes(product.id));
      }
    }
  }, [product, open]);

  const handleWishlistToggle = () => {
    if (!product) return;
    
    const wishlistData = localStorage.getItem("srisha_wishlist");
    let wishlist = wishlistData ? JSON.parse(wishlistData) : [];
    
    if (wishlist.includes(product.id)) {
      wishlist = wishlist.filter((id: string) => id !== product.id);
      setIsWishlisted(false);
    } else {
      wishlist.push(product.id);
      setIsWishlisted(true);
    }
    
    localStorage.setItem("srisha_wishlist", JSON.stringify(wishlist));
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  const handleInquire = () => {
    if (!product) return;
    
    // Check if user is signed in
    const userData = localStorage.getItem("srisha_user");
    if (!userData) {
      onOpenChange(false);
      window.dispatchEvent(new CustomEvent("openAuthModal"));
      return;
    }

    // Add to inquiries
    const inquiriesData = localStorage.getItem("srisha_inquiries");
    let inquiries = inquiriesData ? JSON.parse(inquiriesData) : [];
    
    if (!inquiries.includes(product.id)) {
      inquiries.push(product.id);
      localStorage.setItem("srisha_inquiries", JSON.stringify(inquiries));
      
      // Add to admin inquiries with details
      const adminInquiriesData = localStorage.getItem("admin_inquiries");
      let adminInquiries = adminInquiriesData ? JSON.parse(adminInquiriesData) : [];
      const user = JSON.parse(userData);
      
      adminInquiries.push({
        id: Date.now().toString(),
        customerName: user.name || "Guest",
        contact: user.email || user.phone || "",
        date: new Date().toISOString(),
        items: [{ productId: product.id, productName: product.name, size: selectedSize || "Not specified" }],
        status: "Inquiry Received"
      });
      
      localStorage.setItem("admin_inquiries", JSON.stringify(adminInquiries));
    }
    
    // Open cart drawer
    window.dispatchEvent(new Event("openCartDrawer"));
    
    // Open WhatsApp
    const message = encodeURIComponent(`I would like to inquire about ${product.name}`);
    window.open(`https://wa.me/919000000000?text=${message}`, "_blank");
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    setSelectedImage(allImages[(currentImageIndex + 1) % allImages.length]);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    setSelectedImage(allImages[(currentImageIndex - 1 + allImages.length) % allImages.length]);
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-[1200px] max-h-[95vh] p-0 overflow-hidden">
        <DialogClose className="absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-5 w-5 text-foreground" />
          <span className="sr-only">Close</span>
        </DialogClose>

        <div className="overflow-y-auto max-h-[95vh]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* LEFT: Image Gallery */}
            <div className="relative bg-muted p-4 lg:p-8">
              {/* Desktop: Main image with thumbnails below */}
              <div className="hidden lg:block">
                <div className="w-full aspect-[4/5] mb-4 overflow-hidden">
                  <img
                    src={selectedImage || product.thumbDefault}
                    alt={product.name}
                    className="w-full h-full object-cover transition-opacity duration-300"
                    loading="lazy"
                  />
                </div>
                
                {/* Thumbnails */}
                {allImages.length > 1 && (
                  <div className="flex gap-2 justify-start overflow-x-auto scrollbar-hide">
                    {allImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedImage(img);
                          setCurrentImageIndex(idx);
                        }}
                        className={cn(
                          "flex-shrink-0 w-20 h-24 border-2 transition-all overflow-hidden",
                          selectedImage === img ? "border-primary" : "border-transparent hover:border-muted-foreground"
                        )}
                      >
                        <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile: Swipeable carousel */}
              <div className="lg:hidden">
                <div className="relative w-full aspect-[4/5] overflow-hidden">
                  <img
                    src={allImages[currentImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-opacity duration-300"
                    loading="lazy"
                  />
                  
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 p-2 hover:bg-background transition-colors"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-5 h-5 text-foreground" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 p-2 hover:bg-background transition-colors"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-5 h-5 text-foreground" />
                      </button>
                      
                      {/* Image counter */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 px-3 py-1 text-xs font-lato">
                        {currentImageIndex + 1} / {allImages.length}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: Product Details */}
            <div className="p-6 lg:p-8 flex flex-col">
              <h2 className="text-2xl lg:text-3xl font-tenor text-foreground mb-2">{product.name}</h2>
              <p className="text-xl lg:text-2xl font-lato text-foreground mb-6">{product.price}</p>

              {/* Size Selection */}
              <div className="mb-6">
                <label className="text-sm font-lato text-muted-foreground mb-3 block">SELECT SIZE</label>
                <div className="flex gap-2 flex-wrap">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "px-4 py-2 border font-lato text-sm transition-colors",
                        selectedSize === size
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border hover:bg-muted"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div className="mb-8">
                <label className="text-sm font-lato text-muted-foreground mb-3 block">COLOR</label>
                <div className="flex gap-2">
                  <button className="w-10 h-10 border-2 border-primary bg-accent"></button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-8">
                <Button
                  variant="outline"
                  onClick={handleWishlistToggle}
                  className="flex-1 border-border text-foreground hover:bg-muted font-tenor"
                >
                  <Heart className={cn("w-4 h-4 mr-2", isWishlisted && "fill-current")} />
                  WISHLIST
                </Button>
                <Button
                  onClick={handleInquire}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-tenor"
                >
                  INQUIRE
                </Button>
              </div>

              {/* Description */}
              <div className="border-t border-border pt-6">
                <h3 className="text-sm font-tenor text-foreground mb-3">DESCRIPTION</h3>
                <p className="text-sm font-lato text-muted-foreground leading-relaxed">
                  This exquisite piece showcases traditional craftsmanship with contemporary design. 
                  Each garment is carefully crafted with attention to detail, ensuring the highest quality 
                  and timeless elegance.
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