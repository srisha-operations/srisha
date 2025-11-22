import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { AspectRatio } from "./ui/aspect-ratio";
import productsData from "@/data/products.json";

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchBar = ({ isOpen, onClose }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<typeof productsData.products>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (query.trim()) {
      const filtered = productsData.products.filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-20 left-0 right-0 z-40 bg-background border-b border-border shadow-lg animate-in slide-in-from-top duration-300">
      <div className="px-8 lg:px-16 xl:px-24 py-6">
        {/* Search Input */}
        <div className="flex items-center gap-4">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products..."
            className="flex-1 bg-transparent border-b border-border py-2 font-lato text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
            aria-label="Search products"
          />
          <button
            onClick={onClose}
            className="hover:opacity-60 transition-opacity"
            aria-label="Close search"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <div className="mt-6 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {results.map((product) => (
                <button
                  key={product.id}
                  onClick={() => {
                    // TODO: Open product detail modal
                    console.log("Open product:", product.id);
                    onClose();
                  }}
                  className="text-left hover:opacity-80 transition-opacity"
                >
                  <div className="bg-muted mb-2">
                    <AspectRatio ratio={4 / 5}>
                      <img
                        src={product.thumbDefault}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </AspectRatio>
                  </div>
                  <h4 className="font-tenor text-sm text-foreground mb-1">
                    {product.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">{product.price}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {query && results.length === 0 && (
          <p className="mt-6 text-center text-muted-foreground font-lato text-sm">
            No products found for "{query}"
          </p>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
