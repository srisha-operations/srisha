import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingBag, User, Menu, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import MobileNav from "./MobileNav";
import SearchBar from "./SearchBar";
import WishlistDrawer from "./WishlistDrawer";
import CartDrawer from "./CartDrawer";
import AuthModal from "./AuthModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

// localStorage key: srisha_user
const USER_KEY = "srisha_user";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<"signin" | "signup">("signin");
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  
  const isProductsPage = location.pathname === "/products";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Load user from localStorage
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }

    // Listen for cart drawer and auth modal open events
    const handleOpenCart = () => {
      setIsCartOpen(true);
    };
    
    const handleOpenAuth = () => {
      setAuthView("signin");
      setIsAuthModalOpen(true);
    };
    
    window.addEventListener("openCartDrawer", handleOpenCart);
    window.addEventListener("openAuthModal", handleOpenAuth);
    return () => {
      window.removeEventListener("openCartDrawer", handleOpenCart);
      window.removeEventListener("openAuthModal", handleOpenAuth);
    };
  }, []);

  const handleLogoClick = () => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    } else {
      const hero = document.getElementById("hero");
      hero?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleShopClick = () => {
    navigate("/products");
  };

  const scrollToSection = (id: string) => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(id);
        element?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } else {
      const element = document.getElementById(id);
      element?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const handleAuthSuccess = (userData: { name: string; email: string }) => {
    setUser(userData);
  };

  const showBackground = isScrolled || isHovered || isSearchOpen || isProductsPage;
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
        {/* Desktop Navigation - Hidden on Mobile */}
        <nav className="hidden md:flex gap-8 items-center">
          <button
            onClick={handleShopClick}
            className={`font-lato text-sm ${textColor} hover:opacity-60 transition-all duration-500`}
          >
            Shop
          </button>
          <button
            onClick={() => scrollToSection("footer-contact")}
            className={`font-lato text-sm ${textColor} hover:opacity-60 transition-all duration-500`}
          >
            Contact
          </button>
        </nav>

        {/* Mobile Left - Hamburger Menu */}
        <button
          className="md:hidden hover:opacity-60 transition-opacity"
          onClick={() => setIsMobileNavOpen(true)}
          aria-label="Menu"
        >
          <Menu className="w-5 h-5 transition-all duration-500" strokeWidth={1.5} style={{ color: iconColor }} />
        </button>

        {/* Center Zone - Logo + Brand Name */}
        <button 
          onClick={handleLogoClick}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center hover:opacity-80 transition-opacity"
        >
          <div className={`w-12 h-12 rounded-full border ${showBackground ? "border-[#2C2C2C]" : "border-white/90"} flex items-center justify-center mb-1 transition-all duration-500`}>
            <span className={`font-tenor text-xs ${textColor} transition-all duration-500`}>LOGO</span>
          </div>
          <span className={`font-tenor text-xs ${textColor} tracking-wider transition-all duration-500`}>BRAND NAME</span>
        </button>

        {/* Desktop Right Zone - All Icons */}
        <div className="hidden md:flex gap-6 items-center">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hover:opacity-60 transition-opacity"
            aria-label="Search"
          >
            <Search className="w-5 h-5 transition-all duration-500" strokeWidth={1.5} style={{ color: iconColor }} />
          </button>
          <button
            onClick={() => setIsWishlistOpen(true)}
            className="hover:opacity-60 transition-opacity"
            aria-label="Wishlist"
          >
            <Heart className="w-5 h-5 transition-all duration-500" strokeWidth={1.5} style={{ color: iconColor }} />
          </button>
          <button
            onClick={() => setIsCartOpen(true)}
            className="hover:opacity-60 transition-opacity"
            aria-label="Shopping Bag"
          >
            <ShoppingBag className="w-5 h-5 transition-all duration-500" strokeWidth={1.5} style={{ color: iconColor }} />
          </button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hover:opacity-60 transition-opacity flex items-center gap-1" aria-label="Profile">
                {user ? (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-tenor transition-all duration-500"
                    style={{
                      backgroundColor: showBackground ? "#2C2C2C" : "#FFFFFF",
                      color: showBackground ? "#FFFFFF" : "#2C2C2C",
                    }}
                  >
                    {user.name.substring(0, 2).toUpperCase()}
                  </div>
                ) : (
                  <User className="w-5 h-5 transition-all duration-500" strokeWidth={1.5} style={{ color: iconColor }} />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {user ? (
                <>
                  <DropdownMenuItem disabled className="font-lato text-xs">
                    Signed in as {user.name}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="font-lato">
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

        {/* Mobile Right - Search Icon Only */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="md:hidden hover:opacity-60 transition-opacity"
          aria-label="Search"
        >
          <Search className="w-5 h-5 transition-all duration-500" strokeWidth={1.5} style={{ color: iconColor }} />
        </button>
      </header>

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

      {/* Backdrop blur for drawers */}
      {(isWishlistOpen || isCartOpen) && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" style={{ pointerEvents: 'none' }} />
      )}
    </>
  );
};

export default Header;
