import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ProductDetailModal from "@/components/ProductDetailModal";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Grid3x3, List, MessageSquare, Heart } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/services/auth";
import { listWishlist, addToWishlist, removeFromWishlist } from "@/services/wishlist";
import { toast } from "@/hooks/use-toast";

type ViewMode = "grid" | "list";

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

const Products = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [products, setProducts] = useState<any[]>([]);
  const [productsRaw, setProductsRaw] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<[number, number]>([0, 0]);

  const WISHLIST_KEY = "srisha_wishlist";

  const mapProductForCard = (p: any) => {
    const images = p.product_images || [];
    const sorted = [...images].sort(
      (a: any, b: any) => (a.position ?? 0) - (b.position ?? 0)
    );
    const defaultImg =
      sorted.find((i: any) => !i?.is_hover)?.url || sorted[0]?.url || "";
    const hoverImg =
      sorted.find((i: any) => i?.is_hover)?.url || sorted[1]?.url || defaultImg;

    return {
      ...p, // keep full object so modal can still use variants/images if needed
      thumbDefault: defaultImg,
      thumbHover: hoverImg,
    };
  };

  useEffect(() => {
    const loadWishlistIds = async () => {
      const user = await getCurrentUser();
      const ids = await listWishlist(user?.id ?? null);
      setWishlistIds(ids || []);
    };

    loadWishlistIds();

    const onUpdated = async () => {
      const user = await getCurrentUser();
      const ids = await listWishlist(user?.id ?? null);
      setWishlistIds(ids || []);
    };

    window.addEventListener("wishlistUpdated", onUpdated);
    return () => window.removeEventListener("wishlistUpdated", onUpdated);
  }, []);

  const toggleWishlist = async (productId: string) => {
    const user = await getCurrentUser();
    const uid = user?.id ?? null;
    const prev = wishlistIds.includes(productId);
    // optimistic
    setWishlistIds((s) => (prev ? s.filter((id) => id !== productId) : [...s, productId]));
    try {
      if (prev) await removeFromWishlist(uid, productId);
      else await addToWishlist(uid, productId);
    } catch (err) {
      console.error("toggle wishlist failed", err);
      // revert
      setWishlistIds((s) => (prev ? [...s, productId] : s.filter((id) => id !== productId)));
      toast({ title: "Could not update wishlist" });
    }
  };

  useEffect(() => {
    const loadProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
        *,
        product_images (*),
        product_variants (*)
      `
        )
        .order("name", { ascending: true });

      if (!error && data) {
        const mapped = data.map((p) => {
          const defaultImg = p.product_images?.find((img) => !img.is_hover);
          const hoverImg = p.product_images?.find((img) => img.is_hover);

          // derive a display price: prefer product.price else min variant price
          let displayPrice = p.price ?? null;
          if (displayPrice == null && p.product_variants?.length) {
            const prices = p.product_variants.map((v: any) => v.price || 0);
            displayPrice = Math.min(...prices);
          }

          return {
            ...p,
            thumbDefault: defaultImg?.url || "",
            thumbHover: hoverImg?.url || defaultImg?.url || "",
            displayPrice,
          };
        });

        setProductsRaw(mapped);
        setProducts(mapped);

        // compute sizes and price range
        const sizesSet = new Set<string>();
        let minP = Infinity;
        let maxP = 0;
        mapped.forEach((p) => {
          if (p.product_variants?.length) {
            p.product_variants.forEach((v: any) => {
              if (v.size) sizesSet.add(v.size);
              const vp = v.price ?? 0;
              if (vp < minP) minP = vp;
              if (vp > maxP) maxP = vp;
            });
          }
          if (p.displayPrice != null) {
            const dp = p.displayPrice;
            if (dp < minP) minP = dp;
            if (dp > maxP) maxP = dp;
          }
        });

        const sizes = Array.from(sizesSet).sort();
        setAvailableSizes(sizes);
        if (minP === Infinity) minP = 0;
        setPriceRange([Math.floor(minP), Math.ceil(maxP)]);
        setSelectedPriceRange([Math.floor(minP), Math.ceil(maxP)]);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    const applySort = (list: any[]) => {
      const sorted = [...list];
      if (sortBy === "price-asc") {
        sorted.sort((a, b) => (a.displayPrice ?? 0) - (b.displayPrice ?? 0));
      } else if (sortBy === "price-desc") {
        sorted.sort((a, b) => (b.displayPrice ?? 0) - (a.displayPrice ?? 0));
      } else if (sortBy === "newest") {
        sorted.sort((a, b) => (b.product_id ?? 0) - (a.product_id ?? 0));
      } else if (sortBy === "name-asc") {
        sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      } else if (sortBy === "name-desc") {
        sorted.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
      }
      return sorted;
    };

    setProducts((prev) => applySort(prev));
  }, [sortBy]);

  const applyFilter = () => {
    let filtered = [...productsRaw];
    // sizes
    if (selectedSizes.length) {
      filtered = filtered.filter((p) =>
        p.product_variants?.some((v: any) => selectedSizes.includes(v.size))
      );
    }

    // price
    const [minP, maxP] = selectedPriceRange;
    filtered = filtered.filter((p) => {
      const price = p.displayPrice ?? 0;
      return price >= minP && price <= maxP;
    });

    // apply sorting
      const applySort = (list: any[]) => {
        const sorted = [...list];
        if (sortBy === "price-asc") {
          sorted.sort((a, b) => (a.displayPrice ?? 0) - (b.displayPrice ?? 0));
        } else if (sortBy === "price-desc") {
          sorted.sort((a, b) => (b.displayPrice ?? 0) - (a.displayPrice ?? 0));
        } else if (sortBy === "newest") {
          sorted.sort((a, b) => (b.product_id ?? 0) - (a.product_id ?? 0));
        } else if (sortBy === "name-asc") {
          sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        } else if (sortBy === "name-desc") {
          sorted.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
        }
        return sorted;
      };

    setProducts(applySort(filtered));
  };

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleInquire = (productName: string) => {
    const message = encodeURIComponent(
      `I would like to inquire about ${productName}`
    );
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
                  viewMode === "grid"
                    ? "bg-foreground text-background"
                    : "hover:bg-muted"
                }`}
                aria-label="Grid view"
              >
                <Grid3x3 className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 transition-colors ${
                  viewMode === "list"
                    ? "bg-foreground text-background"
                    : "hover:bg-muted"
                }`}
                aria-label="List view"
              >
                <List className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid/List */}
        {products.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="font-tenor text-2xl text-foreground mb-2">No products match your filters</p>
              <p className="font-lato text-muted-foreground mb-6">Try adjusting your selection and try again</p>
              <Button
                onClick={() => {
                  setSelectedSizes([]);
                  setSelectedPriceRange(priceRange);
                  setProducts(productsRaw);
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8">
            {products.map((product, idx) => (
              <ProductCard
                key={`${product.id}-${idx}`}
                product={mapProductForCard(product)}
                isWishlisted={wishlistIds.includes(product.id)}
                onToggleWishlist={() => toggleWishlist(product.id)}
                onProductClick={handleProductClick}
                primaryActionLabel="ADD TO CART"
                primaryActionHandler={async () => {
                  const { addToCart } = await import("@/services/cart");
                  const user = (await import("@/services/auth")).getCurrentUser();
                  const u = await user;
                  await addToCart({ product_id: product.id, quantity: 1 }, u?.id);
                  // simple scale animation is handled at button level in ProductCard
                  window.dispatchEvent(new Event("cartUpdated"));
                  if (!u) window.dispatchEvent(new CustomEvent("openAuthModal", { detail: "signin" }));
                }}
                showWhatsApp={false}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {products.map((product, idx) => (
              <div
                key={`${product.id}-${idx}`}
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
                      <p className="font-lato text-muted-foreground mb-3">
                        {product.displayPrice ? formatPrice(product.displayPrice) : "N/A"}
                      </p>
                    </button>
                    <p className="font-lato text-sm text-muted-foreground">
                      Exquisite handcrafted piece featuring intricate detailing
                      and premium fabrics.
                    </p>
                  </div>

                  <div className="flex gap-2 mt-4">
                    {/* Wishlist Button */}
                    <button
                      onClick={() => toggleWishlist(product.id)}
                      className="p-2 hover:bg-muted rounded transition-colors hidden md:flex items-center justify-center"
                      aria-label={wishlistIds.includes(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                      title={wishlistIds.includes(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart
                        className="w-5 h-5"
                        strokeWidth={1.5}
                        fill={wishlistIds.includes(product.id) ? "currentColor" : "none"}
                        color={wishlistIds.includes(product.id) ? "#D84545" : "currentColor"}
                      />
                    </button>

                    {/* Add to Cart Button */}
                    <Button
                      onClick={async () => {
                        const { addToCart } = await import("@/services/cart");
                        const { getCurrentUser } = await import("@/services/auth");
                        const user = await getCurrentUser();
                        await addToCart({ product_id: product.id, quantity: 1 }, user?.id);
                        window.dispatchEvent(new Event("cartUpdated"));
                        if (!user) window.dispatchEvent(new CustomEvent("openAuthModal", { detail: "signin" }));
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      ADD TO CART
                    </Button>
                  </div>
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
            <SheetTitle className="font-tenor text-xl tracking-wide">
              Sort By
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6">
            <RadioGroup value={sortBy} onValueChange={setSortBy}>
              <div className="flex items-center space-x-2 mb-4">
                <RadioGroupItem value="default" id="default" />
                <Label htmlFor="default" className="font-lato">
                  Default
                </Label>
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <RadioGroupItem value="name-asc" id="name-asc" />
                <Label htmlFor="name-asc" className="font-lato">
                  Name: A → Z
                </Label>
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <RadioGroupItem value="name-desc" id="name-desc" />
                <Label htmlFor="name-desc" className="font-lato">
                  Name: Z → A
                </Label>
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <RadioGroupItem value="price-asc" id="price-asc" />
                <Label htmlFor="price-asc" className="font-lato">
                  Price: Low to High
                </Label>
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <RadioGroupItem value="price-desc" id="price-desc" />
                <Label htmlFor="price-desc" className="font-lato">
                  Price: High to Low
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="newest" id="newest" />
                <Label htmlFor="newest" className="font-lato">
                  Newest First
                </Label>
              </div>
            </RadioGroup>

            <div className="flex gap-3 mt-8">
              <Button
                variant="outline"
                onClick={() => {
                  setSortBy("default");
                }}
                className="flex-1 font-lato"
              >
                Clear All
              </Button>
              <Button
                onClick={() => setIsSortOpen(false)}
                className="flex-1 font-tenor"
              >
                Apply
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Filter Drawer */}
      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <SheetContent side="right" className="w-[340px]">
          <SheetHeader>
            <SheetTitle className="font-tenor text-xl tracking-wide">
              Filter
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div>
              <h4 className="font-tenor text-sm mb-3">Category</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="saree" />
                  <Label htmlFor="saree" className="font-lato text-sm">
                    Saree
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="lehenga" />
                  <Label htmlFor="lehenga" className="font-lato text-sm">
                    Lehenga
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="kurta" />
                  <Label htmlFor="kurta" className="font-lato text-sm">
                    Kurta Set
                  </Label>
                </div>
              </div>
            </div>

            {availableSizes.length > 0 && (
              <div>
                <h4 className="font-tenor text-sm mb-3">Size</h4>
                <div className="space-y-2">
                  {availableSizes.map((s) => (
                    <div key={s} className="flex items-center space-x-2">
                      <input
                        id={`size-${s}`}
                        type="checkbox"
                        checked={selectedSizes.includes(s)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSizes((prev) => [...prev, s]);
                          } else {
                            setSelectedSizes((prev) => prev.filter((x) => x !== s));
                          }
                        }}
                      />
                      <Label htmlFor={`size-${s}`} className="font-lato text-sm">
                        {s}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-tenor text-sm mb-3">Price</h4>
              <div className="flex items-center gap-2">
                <input
                  aria-label="Min price"
                  type="number"
                  className="border p-2 rounded w-24"
                  value={selectedPriceRange[0]}
                  onChange={(e) =>
                    setSelectedPriceRange([
                      Number(e.target.value || 0),
                      selectedPriceRange[1],
                    ])
                  }
                />
                <span className="text-sm">to</span>
                <input
                  aria-label="Max price"
                  type="number"
                  className="border p-2 rounded w-24"
                  value={selectedPriceRange[1]}
                  onChange={(e) =>
                    setSelectedPriceRange([
                      selectedPriceRange[0],
                      Number(e.target.value || 0),
                    ])
                  }
                />
              </div>
            </div>

            <div>
              <h4 className="font-tenor text-sm mb-3">Color</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="beige" />
                  <Label htmlFor="beige" className="font-lato text-sm">
                    Beige
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="ivory" />
                  <Label htmlFor="ivory" className="font-lato text-sm">
                    Ivory
                  </Label>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-tenor text-sm mb-3">Availability</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="in-stock" />
                  <Label htmlFor="in-stock" className="font-lato text-sm">
                    In Stock
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedSizes([]);
                  setSelectedPriceRange(priceRange);
                  setProducts(productsRaw);
                }}
                className="flex-1 font-lato"
              >
                Clear All
              </Button>
              <Button
                onClick={() => {
                  applyFilter();
                  setIsFilterOpen(false);
                }}
                className="flex-1 font-tenor"
              >
                Apply
              </Button>
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
