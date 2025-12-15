import { Heart, ShoppingBag, User, Store, Mail } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

// will use services to load counts similar to Header
import { listWishlist } from "@/services/wishlist";
import { listCart } from "@/services/cart";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearchOpen: () => void;
  onWishlistOpen: () => void;
  onCartOpen: () => void;
  onAuthOpen: (view: "signin" | "signup") => void;
  user: { name: string; email: string } | null;
  onSignOut: () => void;
  onShopClick: () => void;
  onContactClick: () => void;
  onOrdersClick: () => void;
}

const MobileNav = ({
  open,
  onOpenChange,
  onSearchOpen,
  onWishlistOpen,
  onCartOpen,
  onAuthOpen,
  user,
  onSignOut,
  onShopClick,
  onContactClick,
  onOrdersClick,
}: MobileNavProps) => {
  const navigate = useNavigate();
  const handleNavAction = (action: string) => {
    onOpenChange(false);
    
    switch (action) {
            case "orders":
              onOrdersClick();
              break;
      case "shop":
        onShopClick();
        break;
      case "wishlist":
        onWishlistOpen();
        break;
      case "bag":
        onCartOpen();
        break;
      case "contact":
        onContactClick();
        break;
      case "profile":
        if (!user) {
          onAuthOpen("signin");
        }
        if (user) {
          navigate('/orders');
        }
        break;
      case "signout":
        onSignOut();
        break;
    }
  };

  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const lastFetchRef = useRef<number>(0);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const uid = user?.id;
        const w = await listWishlist(uid);
        const c = await listCart(uid);
        if (!mounted) return;
        setWishlistCount(Array.isArray(w) ? w.length : 0);
        setCartCount(Array.isArray(c) ? c.length : 0);
        lastFetchRef.current = Date.now();
      } catch (e) {
        console.error("MobileNav load counts", e);
      }
    };

    load();

    const onW = () => {
      const now = Date.now();
      if (now - lastFetchRef.current > 1000) load(); // debounce: at least 1s between loads
    };
    const onC = () => {
      const now = Date.now();
      if (now - lastFetchRef.current > 1000) load();
    };
    window.addEventListener("wishlistUpdated", onW);
    window.addEventListener("cartUpdated", onC);
    return () => {
      mounted = false;
      window.removeEventListener("wishlistUpdated", onW);
      window.removeEventListener("cartUpdated", onC);
    };
  }, [user]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="left" 
        className="w-[75vw] bg-background border-r border-border"
      >
        <SheetHeader className="mb-8">
          <SheetTitle className="font-tenor text-lg tracking-wider text-foreground">
            MENU
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-6">
          <button
            onClick={() => handleNavAction("shop")}
            className="flex items-center justify-between gap-3 font-tenor text-base tracking-wide text-foreground hover:text-accent transition-colors duration-300"
          >
            <div className="flex items-center gap-3">
              <Store className="w-5 h-5" strokeWidth={1.5} />
              <span>Shop</span>
            </div>
            <span />
          </button>

          <button
            onClick={() => handleNavAction("wishlist")}
            className="flex items-center justify-between gap-3 font-tenor text-base tracking-wide text-foreground hover:text-accent transition-colors duration-300"
          >
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5" strokeWidth={1.5} />
              <span>Wishlist</span>
            </div>
            {wishlistCount > 0 ? (
              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-gray-100 text-sm font-medium text-foreground">
                {wishlistCount}
              </span>
            ) : (
              <span />
            )}
          </button>

          <button
            onClick={() => handleNavAction("bag")}
            className="flex items-center justify-between gap-3 font-tenor text-base tracking-wide text-foreground hover:text-accent transition-colors duration-300"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
              <span>Bag</span>
            </div>
            {cartCount > 0 ? (
              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-gray-100 text-sm font-medium text-foreground">
                {cartCount}
              </span>
            ) : (
              <span />
            )}
          </button>

          <button
            onClick={() => handleNavAction("contact")}
            className="flex items-center justify-between gap-3 font-tenor text-base tracking-wide text-foreground hover:text-accent transition-colors duration-300"
          >
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5" strokeWidth={1.5} />
              <span>Contact</span>
            </div>
            <span />
          </button>

          {user ? (
            <>
              <div className="flex items-center gap-3 font-tenor text-base tracking-wide text-muted-foreground">
                <User className="w-5 h-5" strokeWidth={1.5} />
                <span className="text-sm">Signed in as {user.email}</span>
              </div>
              <button
                onClick={() => handleNavAction('orders')}
                className="flex items-center gap-3 font-tenor text-base tracking-wide text-foreground hover:text-accent transition-colors duration-300 text-left"
              >
                <span>My Orders</span>
              </button>
              <button
                onClick={() => handleNavAction('profile')}
                className="flex items-center gap-3 font-tenor text-base tracking-wide text-foreground hover:text-accent transition-colors duration-300 text-left"
              >
                <span>Profile</span>
              </button>
              <button
                onClick={() => handleNavAction("signout")}
                className="flex items-center gap-3 font-tenor text-base tracking-wide text-foreground hover:text-accent transition-colors duration-300 text-left"
              >
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => handleNavAction("profile")}
              className="flex items-center gap-3 font-tenor text-base tracking-wide text-foreground hover:text-accent transition-colors duration-300 text-left"
            >
              <User className="w-5 h-5" strokeWidth={1.5} />
              <span>Profile</span>
            </button>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
