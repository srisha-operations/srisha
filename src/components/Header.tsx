import { Link } from "react-router-dom";
import { Search, Heart, ShoppingBag, User } from "lucide-react";

const Header = () => {
  return (
    <header className="w-full h-20 flex items-center justify-between px-8 lg:px-16 xl:px-24 absolute top-0 left-0 z-50 bg-transparent">
      {/* Left Zone - Navigation Links */}
      <nav className="flex gap-8 items-center">
        <Link to="/" className="font-lato text-sm text-foreground hover:opacity-60 transition-opacity">
          Shop
        </Link>
        <Link to="/" className="font-lato text-sm text-foreground hover:opacity-60 transition-opacity">
          Contact
        </Link>
      </nav>

      {/* Center Zone - Logo + Brand Name */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <div className="w-12 h-12 rounded-full border border-foreground flex items-center justify-center mb-1">
          <span className="font-tenor text-xs text-foreground">LOGO</span>
        </div>
        <span className="font-tenor text-xs text-foreground tracking-wider">BRAND NAME</span>
      </div>

      {/* Right Zone - Icons */}
      <div className="flex gap-6 items-center">
        <button className="hover:opacity-60 transition-opacity" aria-label="Search">
          <Search className="w-5 h-5 text-foreground" strokeWidth={1.5} />
        </button>
        <button className="hover:opacity-60 transition-opacity" aria-label="Wishlist">
          <Heart className="w-5 h-5 text-foreground" strokeWidth={1.5} />
        </button>
        <button className="hover:opacity-60 transition-opacity" aria-label="Shopping Bag">
          <ShoppingBag className="w-5 h-5 text-foreground" strokeWidth={1.5} />
        </button>
        <button className="hover:opacity-60 transition-opacity" aria-label="Profile">
          <User className="w-5 h-5 text-foreground" strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
};

export default Header;
