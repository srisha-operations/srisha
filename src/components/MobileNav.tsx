import { Heart, ShoppingBag, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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
}: MobileNavProps) => {
  const handleNavAction = (action: string) => {
    onOpenChange(false);
    
    switch (action) {
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
        break;
      case "signout":
        onSignOut();
        break;
    }
  };

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
            className="flex items-center gap-3 font-tenor text-base tracking-wide text-foreground hover:text-accent transition-colors duration-300 text-left"
          >
            <span>Shop</span>
          </button>

          <button
            onClick={() => handleNavAction("wishlist")}
            className="flex items-center gap-3 font-tenor text-base tracking-wide text-foreground hover:text-accent transition-colors duration-300 text-left"
          >
            <Heart className="w-5 h-5" strokeWidth={1.5} />
            <span>Wishlist</span>
          </button>

          <button
            onClick={() => handleNavAction("bag")}
            className="flex items-center gap-3 font-tenor text-base tracking-wide text-foreground hover:text-accent transition-colors duration-300 text-left"
          >
            <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
            <span>Bag</span>
          </button>

          <button
            onClick={() => handleNavAction("contact")}
            className="flex items-center gap-3 font-tenor text-base tracking-wide text-foreground hover:text-accent transition-colors duration-300 text-left"
          >
            <span>Contact</span>
          </button>

          {user ? (
            <>
              <div className="flex items-center gap-3 font-tenor text-base tracking-wide text-muted-foreground">
                <User className="w-5 h-5" strokeWidth={1.5} />
                <span className="text-sm">Signed in as {user.name}</span>
              </div>
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
