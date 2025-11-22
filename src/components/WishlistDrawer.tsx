import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { AspectRatio } from "./ui/aspect-ratio";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import productsData from "@/data/products.json";

interface WishlistDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// localStorage key: srisha_wishlist
const WISHLIST_KEY = "srisha_wishlist";

const WishlistDrawer = ({ open, onOpenChange }: WishlistDrawerProps) => {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      loadWishlist();
    }
  }, [open]);

  const loadWishlist = () => {
    const stored = localStorage.getItem(WISHLIST_KEY);
    if (stored) {
      try {
        setWishlistIds(JSON.parse(stored));
      } catch {
        setWishlistIds([]);
      }
    } else {
      setWishlistIds([]);
    }
  };

  const wishlistProducts = productsData.products.filter((p) =>
    wishlistIds.includes(p.id)
  );

  const handleInquire = (productName: string) => {
    const message = encodeURIComponent(`I would like to inquire about ${productName}`);
    window.open(`https://wa.me/PHONE_NUMBER?text=${message}`, "_blank");
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

        {wishlistProducts.length === 0 ? (
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
          <div className="space-y-4">
            {wishlistProducts.map((product, index) => (
              <div
                key={product.id}
                className="flex gap-4 border-b border-border pb-4 last:border-0"
              >
                <div className="flex-shrink-0 w-12 text-center">
                  <span className="font-lato text-sm text-muted-foreground">
                    {index + 1}
                  </span>
                </div>
                <div className="w-20 flex-shrink-0">
                  <AspectRatio ratio={4 / 5}>
                    <img
                      src={product.thumbDefault}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </AspectRatio>
                </div>
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => {
                      // TODO: Open product detail modal
                      console.log("Open product:", product.id);
                    }}
                    className="text-left hover:opacity-80 transition-opacity block w-full"
                  >
                    <h4 className="font-tenor text-base text-foreground mb-1 truncate">
                      {product.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">{product.price}</p>
                  </button>
                </div>
                <div className="flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleInquire(product.name)}
                    className="font-lato text-xs"
                  >
                    Inquire
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default WishlistDrawer;
