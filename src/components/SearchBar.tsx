import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { AspectRatio } from "./ui/aspect-ratio";
import { supabase } from "@/lib/supabaseClient";

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Module-level cache for search results
const searchCache = new Map<string, { results: any[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const SearchBar = ({ isOpen, onClose }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // no navigation here; search should always open product modal

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
    let mounted = true;

    const executeSearch = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      const q = query.trim().toLowerCase();

      // Check cache first
      const cacheKey = q;
      const cached = searchCache.get(cacheKey);
      const now = Date.now();

      if (cached && now - cached.timestamp < CACHE_TTL) {
        // Cache hit - use cached results
        if (mounted) {
          setResults(cached.results);
        }
        return;
      }

      // Cache miss - fetch from API
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, name, slug, product_images(*), price, product_variants(*)")
          .ilike("name", `%${q}%`)
          .limit(20);

        if (error) {
          console.error("search error", error);
          if (mounted) setResults([]);
          return;
        }

        if (!mounted) return;

        // Store in cache
        // Normalize results to include displayPrice. Don't assume presence of price field.
        const results = (data || []).map((p: any) => {
          let displayPrice = p.price ?? null;
          if (displayPrice == null && p.product_variants?.length) {
            const pairs = p.product_variants.map((v: any) => v.price ?? 0);
            displayPrice = Math.min(...pairs);
          }
          // Normalize price on search result to avoid NaN in modals that expect 'price'
          const normalized = { ...p, price: displayPrice };
          return normalized;
        });
        searchCache.set(cacheKey, { results, timestamp: now });
        setResults(results);
      } catch (e) {
        console.error("search exception:", e);
        if (mounted) setResults([]);
      }
    };

    // Debounce the search (300ms)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(executeSearch, 300);

    return () => {
      mounted = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
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
                {results.map((product) => {
                const thumb = (product.product_images || [])[0]?.url || "";
                return (
                  <button
                       key={product.id}
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent("openProductModal", { detail: product }));
                      onClose();
                    }}
                    className="text-left hover:opacity-80 transition-opacity"
                  >
                    <div className="bg-muted mb-2">
                      <AspectRatio ratio={4 / 5}>
                        <img
                          src={thumb}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      </AspectRatio>
                    </div>
                    <h4 className="font-tenor text-sm text-foreground mb-1">
                      {product.name}
                    </h4>
                  </button>
                );
              })}
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
