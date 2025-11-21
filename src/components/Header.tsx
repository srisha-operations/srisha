import { Link } from "react-router-dom";
import { Search, Heart, ShoppingBag, User } from "lucide-react";
import { useState, useEffect } from "react";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const showBackground = isScrolled || isHovered;
  const textColor = showBackground ? "text-[#2C2C2C]" : "text-white/90";
  const iconColor = showBackground ? "#2C2C2C" : "#FFFFFF";

  return (
    <header 
      className={`w-full h-20 flex items-center justify-between px-8 lg:px-16 xl:px-24 fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        showBackground ? "bg-[#F8F5F0] shadow-sm" : "bg-transparent"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left Zone - Navigation Links */}
      <nav className="flex gap-8 items-center">
        <Link to="/" className={`font-lato text-sm ${textColor} hover:opacity-60 transition-all duration-500`}>
          Shop
        </Link>
        <Link to="/" className={`font-lato text-sm ${textColor} hover:opacity-60 transition-all duration-500`}>
          Contact
        </Link>
      </nav>

      {/* Center Zone - Logo + Brand Name */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <div className={`w-12 h-12 rounded-full border ${showBackground ? "border-[#2C2C2C]" : "border-white/90"} flex items-center justify-center mb-1 transition-all duration-500`}>
          <span className={`font-tenor text-xs ${textColor} transition-all duration-500`}>LOGO</span>
        </div>
        <span className={`font-tenor text-xs ${textColor} tracking-wider transition-all duration-500`}>BRAND NAME</span>
      </div>

      {/* Right Zone - Icons */}
      <div className="flex gap-6 items-center">
        <button className="hover:opacity-60 transition-opacity" aria-label="Search">
          <Search className="w-5 h-5 transition-all duration-500" strokeWidth={1.5} style={{ color: iconColor }} />
        </button>
        <button className="hover:opacity-60 transition-opacity" aria-label="Wishlist">
          <Heart className="w-5 h-5 transition-all duration-500" strokeWidth={1.5} style={{ color: iconColor }} />
        </button>
        <button className="hover:opacity-60 transition-opacity" aria-label="Shopping Bag">
          <ShoppingBag className="w-5 h-5 transition-all duration-500" strokeWidth={1.5} style={{ color: iconColor }} />
        </button>
        <button className="hover:opacity-60 transition-opacity" aria-label="Profile">
          <User className="w-5 h-5 transition-all duration-500" strokeWidth={1.5} style={{ color: iconColor }} />
        </button>
      </div>
    </header>
  );
};

export default Header;
