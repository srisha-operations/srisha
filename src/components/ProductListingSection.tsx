import { useState } from "react";
import ProductCard from "./ProductCard";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { SlidersHorizontal, ArrowUpDown } from "lucide-react";
import productsData from "@/data/products.json";
import { Link } from "react-router-dom";

type SortOption = "price-asc" | "price-high" | "newest";

const ProductListingSection = () => {
  const [wishlistState, setWishlistState] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // Sort products
  const sortedProducts = [...productsData.products].sort((a, b) => {
    const priceA = parseInt(a.price.replace(/[^0-9]/g, ""));
    const priceB = parseInt(b.price.replace(/[^0-9]/g, ""));
    
    switch (sortBy) {
      case "price-asc":
        return priceA - priceB;
      case "price-high":
        return priceB - priceA;
      case "newest":
      default:
        return a.order - b.order;
    }
  });

  const toggleWishlist = (id: string) => {
    setWishlistState((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section className="w-full py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Title */}
        <h2 className="font-tenor text-3xl md:text-4xl text-center mb-8 text-foreground">
          Collections
        </h2>

        {/* Sort & Filter Controls */}
        <div className="flex justify-end gap-3 mb-8">
          <Sheet open={sortOpen} onOpenChange={setSortOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Sort By
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[340px] sm:w-[340px]">
              <SheetHeader>
                <SheetTitle className="font-tenor">Sort By</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => {
                    setSortBy("price-asc");
                    setSortOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                    sortBy === "price-asc"
                      ? "bg-muted text-foreground font-medium"
                      : "hover:bg-muted/50"
                  }`}
                >
                  Price: Low to High
                </button>
                <button
                  onClick={() => {
                    setSortBy("price-high");
                    setSortOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                    sortBy === "price-high"
                      ? "bg-muted text-foreground font-medium"
                      : "hover:bg-muted/50"
                  }`}
                >
                  Price: High to Low
                </button>
                <button
                  onClick={() => {
                    setSortBy("newest");
                    setSortOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                    sortBy === "newest"
                      ? "bg-muted text-foreground font-medium"
                      : "hover:bg-muted/50"
                  }`}
                >
                  Newest First
                </button>
              </div>
            </SheetContent>
          </Sheet>

          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filter
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[340px] sm:w-[340px]">
              <SheetHeader>
                <SheetTitle className="font-tenor">Filter</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Category</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Sarees</p>
                    <p>• Kurta Sets</p>
                    <p>• Lehengas</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Color</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Ivory</p>
                    <p>• Gold</p>
                    <p>• Rose</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Availability</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• In Stock</p>
                    <p>• Made to Order</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Price Range</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Under ₹50,000</p>
                    <p>• ₹50,000 - ₹80,000</p>
                    <p>• Above ₹80,000</p>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Horizontal Scrollable Product Grid */}
        <div className="relative">
          {/* Left shadow gradient */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          
          {/* Scrollable container */}
          <div className="overflow-x-auto pb-4 -mx-4 px-4 scroll-smooth">
            <div className="flex gap-6 md:gap-8 min-w-max">
              {sortedProducts.map((product) => (
                <div
                  key={product.id}
                  className="w-[45vw] md:w-[22vw] flex-shrink-0"
                >
                  <ProductCard
                    product={product}
                    isWishlisted={wishlistState[product.id] || false}
                    onToggleWishlist={() => toggleWishlist(product.id)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right shadow gradient */}
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
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
    </section>
  );
};

export default ProductListingSection;
