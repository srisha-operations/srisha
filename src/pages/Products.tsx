import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ProductDetailModal from "@/components/ProductDetailModal";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Grid3x3, List, MessageSquare } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import productsData from "@/data/products.json";

type ViewMode = "grid" | "list";

const Products = () => {
  const [products, setProducts] = useState(productsData.products);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>("default");
  const [selectedProduct, setSelectedProduct] = useState<typeof productsData.products[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  const WISHLIST_KEY = "srisha_wishlist";

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = () => {
    const stored = localStorage.getItem(WISHLIST_KEY);
    if (stored) {
      try {
        setWishlistIds(JSON.parse(stored));
      } catch {
        setWishlistIds([]);
      }
    }
  };

  useEffect(() => {
    let sorted = [...productsData.products];

    if (sortBy === "price-asc") {
      sorted.sort((a, b) => {
        const priceA = parseInt(a.price.replace(/[^0-9]/g, ""));
        const priceB = parseInt(b.price.replace(/[^0-9]/g, ""));
        return priceA - priceB;
      });
    } else if (sortBy === "price-desc") {
      sorted.sort((a, b) => {
        const priceA = parseInt(a.price.replace(/[^0-9]/g, ""));
        const priceB = parseInt(b.price.replace(/[^0-9]/g, ""));
        return priceB - priceA;
      });
    } else if (sortBy === "newest") {
      sorted.sort((a, b) => b.order - a.order);
    }

    setProducts(sorted);
  }, [sortBy]);

  const handleProductClick = (product: typeof productsData.products[0]) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleInquire = (productName: string) => {
    const message = encodeURIComponent(`I would like to inquire about ${productName}`);
    window.open(`https://wa.me/PHONE_NUMBER?text=${message}`, "_blank");
  };

  return (
    <div className="w-full min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-[100px] px-8 lg:px-16 xl:px-24">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12 gap-4">
          <h1 className="font-tenor text-4xl lg:text-5xl text-foreground tracking-wide">
            Collections
          </h1>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setIsSortOpen(true)}
              className="font-lato"
            >
              Sort By
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsFilterOpen(true)}
              className="font-lato"
            >
              Filter
            </Button>
            
            {/* View Mode Toggle */}
            <div className="flex border border-border rounded">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-colors ${
                  viewMode === "grid" ? "bg-foreground text-background" : "hover:bg-muted"
                }`}
                aria-label="Grid view"
              >
                <Grid3x3 className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 transition-colors ${
                  viewMode === "list" ? "bg-foreground text-background" : "hover:bg-muted"
                }`}
                aria-label="List view"
              >
                <List className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={wishlistIds.includes(product.id)}
                onToggleWishlist={() => {
                  const stored = localStorage.getItem(WISHLIST_KEY);
                  const wishlist: string[] = stored ? JSON.parse(stored) : [];
                  if (wishlist.includes(product.id)) {
                    const updated = wishlist.filter((id) => id !== product.id);
                    localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
                    loadWishlist();
                  } else {
                    wishlist.push(product.id);
                    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
                    loadWishlist();
                  }
                }}
                onProductClick={handleProductClick}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex gap-6 border border-border p-4 hover:border-foreground transition-colors group"
              >
                <button
                  onClick={() => handleProductClick(product)}
                  className="w-32 flex-shrink-0"
                >
                  <AspectRatio ratio={4 / 5}>
                    <img
                      src={product.thumbDefault}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </AspectRatio>
                </button>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <button
                      onClick={() => handleProductClick(product)}
                      className="text-left"
                    >
                      <h3 className="font-tenor text-xl text-foreground mb-2 group-hover:opacity-70 transition-opacity">
                        {product.name}
                      </h3>
                      <p className="font-lato text-muted-foreground mb-3">{product.price}</p>
                    </button>
                    <p className="font-lato text-sm text-muted-foreground">
                      Exquisite handcrafted piece featuring intricate detailing and premium fabrics.
                    </p>
                  </div>

                  <Button
                    onClick={() => handleInquire(product.name)}
                    variant="outline"
                    className="w-fit mt-4"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Inquire
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Sort Drawer */}
      <Sheet open={isSortOpen} onOpenChange={setIsSortOpen}>
        <SheetContent side="right" className="w-[340px]">
          <SheetHeader>
            <SheetTitle className="font-tenor text-xl tracking-wide">Sort By</SheetTitle>
          </SheetHeader>

          <div className="mt-6">
            <RadioGroup value={sortBy} onValueChange={setSortBy}>
              <div className="flex items-center space-x-2 mb-4">
                <RadioGroupItem value="default" id="default" />
                <Label htmlFor="default" className="font-lato">Default</Label>
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <RadioGroupItem value="price-asc" id="price-asc" />
                <Label htmlFor="price-asc" className="font-lato">Price: Low to High</Label>
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <RadioGroupItem value="price-desc" id="price-desc" />
                <Label htmlFor="price-desc" className="font-lato">Price: High to Low</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="newest" id="newest" />
                <Label htmlFor="newest" className="font-lato">Newest First</Label>
              </div>
            </RadioGroup>
          </div>
        </SheetContent>
      </Sheet>

      {/* Filter Drawer */}
      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <SheetContent side="right" className="w-[340px]">
          <SheetHeader>
            <SheetTitle className="font-tenor text-xl tracking-wide">Filter</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div>
              <h4 className="font-tenor text-sm mb-3">Category</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="saree" />
                  <Label htmlFor="saree" className="font-lato text-sm">Saree</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="lehenga" />
                  <Label htmlFor="lehenga" className="font-lato text-sm">Lehenga</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="kurta" />
                  <Label htmlFor="kurta" className="font-lato text-sm">Kurta Set</Label>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-tenor text-sm mb-3">Color</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="beige" />
                  <Label htmlFor="beige" className="font-lato text-sm">Beige</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="ivory" />
                  <Label htmlFor="ivory" className="font-lato text-sm">Ivory</Label>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-tenor text-sm mb-3">Availability</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="in-stock" />
                  <Label htmlFor="in-stock" className="font-lato text-sm">In Stock</Label>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ProductDetailModal
        product={selectedProduct}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
};

export default Products;
