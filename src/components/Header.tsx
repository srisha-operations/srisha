import { useLocation, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingBag, User, Menu } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import contentData from "@/data/content.json";
import MobileNav from "./MobileNav";
import SearchBar from "./SearchBar";
import WishlistDrawer from "./WishlistDrawer";
import CartDrawer from "./CartDrawer";
import AuthModal from "./AuthModal";
import ProductDetailModal from "./ProductDetailModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser, signOut } from "@/services/auth";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<"signin" | "signup">("signin");

  const [content, setContent] = useState(contentData);
  const [brand, setBrand] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const prevLoggedInRef = useRef<boolean | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const isProductsPage = location.pathname === "/products";

  useEffect(() => {
    const handleOpenProductModal = (e: Event) => {
      const customEvent = e as CustomEvent;
      setSelectedProduct(customEvent.detail);
      setIsProductModalOpen(true);
    };

    window.addEventListener("openProductModal", handleOpenProductModal);
    return () => window.removeEventListener("openProductModal", handleOpenProductModal);
  }, []);

  useEffect(() => {
    const handleOpenAuthModal = (e: Event) => {
      const customEvent = e as CustomEvent;
      const view = customEvent.detail || "signin";
      setAuthView(view);
      setIsAuthModalOpen(true);
    };

    window.addEventListener("openAuthModal", handleOpenAuthModal);
    return () => window.removeEventListener("openAuthModal", handleOpenAuthModal);
  }, []);

  useEffect(() => {
    let mounted = true;
    // track prior auth state in this tab to avoid toasting on reloads
    (async () => {
      try {
        const u = await getCurrentUser();
        if (!mounted) return;
        setUser(u);
        // record initial state (logged in or not)
        prevLoggedInRef.current = !!u;
      } catch (e) {
        console.error("getCurrentUser error:", e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Listen for Supabase auth state changes
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user || null;
      const prev = prevLoggedInRef.current;
      setUser(u);

      // Only show toast when transitioning from logged-out -> logged-in in this tab
      try {
        if (!prev && u) {
          toast({ title: "Signed in successfully", duration: 3000 });
        }
      } catch (e) {
        console.error("Toast error:", e);
      }

      // update prior state marker
      prevLoggedInRef.current = !!u;
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadWishlistCount = async () => {
      try {
        const { listWishlist } = await import("@/services/wishlist");
        const uid = user?.id;
        const w = await listWishlist(uid);
        if (mounted) {
          setWishlistCount(Array.isArray(w) ? w.length : 0);
        }
      } catch (err) {
        console.error("Failed to load wishlist count:", err);
        if (mounted) setWishlistCount(0);
      }
    };

    const update = () => {
      loadWishlistCount();
    };

    loadWishlistCount(); // Initial load
    window.addEventListener("wishlistUpdated", update);
    return () => {
      mounted = false;
      window.removeEventListener("wishlistUpdated", update);
    };
  }, [user]);

  useEffect(() => {
    const update = async () => {
      // load cart count for user or local
      try {
        const { listCart } = await import("@/services/cart");
        const uid = user?.id;
        const items = await listCart(uid);
        setCartCount(items ? items.length : 0);
      } catch (e) {
        console.error("Failed to load cart count:", e);
      }
    };

    update();

    const onCart = () => update();
    window.addEventListener("cartUpdated", onCart);
    return () => window.removeEventListener("cartUpdated", onCart);
  }, [user]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const loadBrand = async () => {
      const { data } = await supabase
        .from("site_content")
        .select("value")
        .eq("key", "brand")
        .single();

      if (data?.value) setBrand(data.value);
    };

    loadBrand();
  }, []);

  // Sign Out using Supabase
  const handleSignOut = async () => {
    await signOut();
    // clear UI state and local storage on logout
    setUser(null);
    setWishlistCount(0);
    setCartCount(0);
  };

  // Called after a successful auth (sign in / sign up) to merge local data
  const handleAuthSuccess = async () => {
    const u = await getCurrentUser();
    if (!u) return;
    setUser(u);

    try {
      // merge local cart -> remote
      const { mergeLocalCartToRemote } = await import("@/services/cart");
      await mergeLocalCartToRemote(u.id);
    } catch (e) {
      console.error("mergeLocalCartToRemote failed:", e);
    }

    try {
      // merge local wishlist -> remote
      const local = localStorage.getItem("srisha_wishlist");
      if (local) {
        const ids: string[] = JSON.parse(local);
        if (ids && ids.length) {
          const { addWishlistItem } = await import("@/services/wishlist");
          for (const pid of ids) {
            try {
              await addWishlistItem(u.id, pid);
            } catch (err) {
              // ignore individual errors
            }
          }
        }
        localStorage.removeItem("srisha_wishlist");
      }
    } catch (e) {
      console.error("merge wishlist failed:", e);
    }

    // fire updates and reload counts
    window.dispatchEvent(new Event("cartUpdated"));
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  const handleLogoClick = () => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
    } else {
      document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleShopClick = () => navigate("/products");

  const scrollToSection = (id: string) => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Compute initials
  const initials = user?.user_metadata?.name
    ? user.user_metadata.name.substring(0, 2).toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase();

  const isCheckoutPage = location.pathname === "/checkout";
  const showBackground =
    isScrolled || isHovered || isSearchOpen || isProductsPage || isCheckoutPage;

  const textColor = showBackground ? "text-[#2C2C2C]" : "text-white/90";
  const iconColor = showBackground ? "#2C2C2C" : "#FFFFFF";

  return (
    <>
      <header
        className={`w-full h-20 flex items-center justify-between px-8 lg:px-16 xl:px-24 fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          showBackground ? "bg-[#F8F5F0] shadow-sm" : "bg-transparent"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-8 items-center">
          <button
            onClick={handleShopClick}
            className={`font-lato text-sm ${textColor} hover:opacity-60`}
          >
            Shop
          </button>
          <button
            onClick={() => scrollToSection("footer-contact")}
            className={`font-lato text-sm ${textColor} hover:opacity-60`}
          >
            Contact
          </button>
        </nav>

        {/* Mobile Menu */}
        <button
          className="md:hidden hover:opacity-60"
          onClick={() => setIsMobileNavOpen(true)}
          aria-label="Open menu"
        >
          <Menu
            strokeWidth={1.5}
            className="w-5 h-5"
            style={{ color: iconColor }}
            aria-label="Open menu"
          />
        </button>

        {/* Brand Logo */}
        <button
          onClick={handleLogoClick}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 hover:opacity-80"
          aria-label="Home"
        >
          {brand?.logo && (
            <img
              src={brand.logo}
              alt={brand?.name || "SRISHA"}
              loading="lazy"
              decoding="async"
              className="h-15 w-auto object-contain"
            />
          )}
        </button>

        {/* Right Icons */}
        <div className="hidden md:flex gap-6 items-center">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hover:opacity-60"
            aria-label="Open search"
          >
            <Search
              strokeWidth={1.5}
              className="w-5 h-5"
              style={{ color: iconColor }}
            />
          </button>

          <button
            onClick={() => setIsWishlistOpen(true)}
            className="hover:opacity-60"
            aria-label="Open wishlist"
          >
            <div className="relative">
              <Heart
                strokeWidth={1.5}
                className="w-5 h-5"
                style={{ color: iconColor }}
              />

              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-[1px] font-medium">
                  {wishlistCount}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setIsCartOpen(true)}
            className="hover:opacity-60"
            aria-label="Open cart"
          >
            <div className="relative">
              <ShoppingBag
                strokeWidth={1.5}
                className="w-5 h-5"
                style={{ color: iconColor }}
              />

              {cartCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-[1px] font-medium">
                  {cartCount}
                </span>
              )}
            </div>
          </button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hover:opacity-60 flex items-center" aria-label="Open profile menu">
                {user ? (
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-tenor ${
                      showBackground ? "bg-[#2C2C2C] text-white" : "bg-white text-[#2C2C2C]"
                    }`}
                  >
                    {initials}
                  </div>
                ) : (
                  <User
                    strokeWidth={1.5}
                    className="w-5 h-5"
                    style={{ color: iconColor }}
                  />
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              {user ? (
                <>
                  <DropdownMenuItem disabled className="font-lato text-xs">
                    Signed in as {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="font-lato"
                  >
                    Sign Out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      setAuthView("signin");
                      setIsAuthModalOpen(true);
                    }}
                    className="font-lato"
                  >
                    Sign In
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setAuthView("signup");
                      setIsAuthModalOpen(true);
                    }}
                    className="font-lato"
                  >
                    Sign Up
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Search */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="md:hidden hover:opacity-60"
          aria-label="Open search"
        >
          <Search
            strokeWidth={1.5}
            className="w-5 h-5"
            style={{ color: iconColor }}
          />
        </button>
      </header>

      {/* Drawers & Modals */}
      <MobileNav
        open={isMobileNavOpen}
        onOpenChange={setIsMobileNavOpen}
        onSearchOpen={() => setIsSearchOpen(true)}
        onWishlistOpen={() => setIsWishlistOpen(true)}
        onCartOpen={() => setIsCartOpen(true)}
        onAuthOpen={(view) => {
          setAuthView(view);
          setIsAuthModalOpen(true);
        }}
        user={user}
        onSignOut={handleSignOut}
        onShopClick={handleShopClick}
        onContactClick={() => scrollToSection("footer-contact")}
      />

      <SearchBar isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <WishlistDrawer open={isWishlistOpen} onOpenChange={setIsWishlistOpen} />
      <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />

      <AuthModal
        open={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
        defaultView={authView}
        onAuthSuccess={handleAuthSuccess}
      />

      <ProductDetailModal
        product={selectedProduct}
        open={isProductModalOpen}
        onOpenChange={setIsProductModalOpen}
      />

      {(isWishlistOpen || isCartOpen) && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 pointer-events-none" />
      )}
    </>
  );
};

export default Header;
