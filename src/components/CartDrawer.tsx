import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { AspectRatio } from "./ui/aspect-ratio";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import productsData from "@/data/products.json";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// localStorage key: srisha_inquiries
const INQUIRIES_KEY = "srisha_inquiries";

const CartDrawer = ({ open, onOpenChange }: CartDrawerProps) => {
  const [inquiryIds, setInquiryIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      loadInquiries();
    }
  }, [open]);

  const loadInquiries = () => {
    const stored = localStorage.getItem(INQUIRIES_KEY);
    if (stored) {
      try {
        setInquiryIds(JSON.parse(stored));
      } catch {
        setInquiryIds([]);
      }
    } else {
      setInquiryIds([]);
    }
  };

  const inquiryProducts = productsData.products.filter((p) =>
    inquiryIds.includes(p.id)
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full md:w-[400px] lg:w-[500px] bg-background overflow-y-auto"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="font-tenor text-2xl tracking-wide text-foreground">
            Inquired Items
          </SheetTitle>
        </SheetHeader>

        {inquiryProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="font-lato text-muted-foreground mb-4">
              You haven't inquired about any items yet
            </p>
            <Link to="/" onClick={() => onOpenChange(false)}>
              <Button variant="outline" className="font-lato">
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiryProducts.map((product, index) => (
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
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
