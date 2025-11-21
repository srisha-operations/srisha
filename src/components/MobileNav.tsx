import { Link } from "react-router-dom";
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
}

const MobileNav = ({ open, onOpenChange }: MobileNavProps) => {
  const navItems = [
    { label: "Shop", href: "/" },
    { label: "Wishlist", href: "/", icon: Heart },
    { label: "Bag", href: "/", icon: ShoppingBag },
    { label: "Contact", href: "/" },
    { label: "Profile", href: "/", icon: User },
  ];

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
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-3 font-tenor text-base tracking-wide text-foreground hover:text-accent transition-colors duration-300"
            >
              {item.icon && <item.icon className="w-5 h-5" strokeWidth={1.5} />}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
