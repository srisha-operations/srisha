import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import images from "@/data/images.json";
import content from "@/data/content.json";

const GallerySection = ({ gallery }: { gallery: any }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inViewItems, setInViewItems] = useState<Set<string>>(new Set());

  // Set up intersection observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("data-id");
          if (!id) return;

          if (entry.isIntersecting) {
            setInViewItems((prev) => new Set([...prev, id]));
          } else {
            setInViewItems((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          }
        });
      },
      { threshold: 0.5 }
    );

    // Observe all gallery images
    const elements = document.querySelectorAll("[data-gallery-image]");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [isExpanded]);

  return (
    <section className="w-full bg-background py-[30px]">
      <div className="container mx-auto px-4">
        {/* Section Title with Collapse Toggle */}
        <div className="flex items-center justify-center mb-12 md:mb-12 relative">
          <h2 className="text-3xl md:text-4xl font-tenor text-center text-foreground">
            {gallery.title}
          </h2>
          {isExpanded && (
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute right-0 font-tenor text-2xl text-foreground hover:opacity-60 transition-opacity"
              aria-label="Collapse gallery"
            >
              −
            </button>
          )}
        </div>

        {/* Block 1: Collapsible 16:9 Hero */}
        <div className="relative w-full mb-16 md:mb-12">
          <div className="relative w-full aspect-video overflow-hidden">
            <img
              src={gallery?.hero_block?.image || ""}
              alt={gallery?.hero_block?.alt || ""}
              className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-300 ease-out"
              loading="lazy"
              data-gallery-image
              data-id="hero-block"
            />

            {!isExpanded && (
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/50 flex items-center justify-center transition-opacity duration-700">
                <Button
                  onClick={() => setIsExpanded(true)}
                  className="bg-transparent border border-white/90 text-white/90 hover:bg-[#F3EEE6] hover:text-[#2C2C2C] hover:border-[#2C2C2C] font-tenor tracking-wider px-8 py-6 text-base transition-all duration-500 rounded-none"
                >
                  {gallery.hero_cta}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Expanded Gallery Content */}
        {isExpanded && (
          <div className="space-y-16 md:space-y-24 animate-fade-in">
            {/* Block 2: 4:5 Portrait + Text (Image Left, Text Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div className="w-full aspect-[4/5] overflow-hidden">
                <img
                  src={gallery?.blocks?.portrait_left?.image || ""}
                  alt={gallery?.blocks?.portrait_left?.alt || ""}
                  className={`w-full h-full object-cover object-center hover:scale-103 transition-all duration-300 ease-out ${
                    inViewItems.has("portrait-left")
                      ? "scale-102 opacity-100"
                      : "scale-100 opacity-80"
                  }`}
                  loading="lazy"
                  decoding="async"
                  data-gallery-image
                  data-id="portrait-left"
                />
              </div>
              <div className="flex flex-col justify-center space-y-4 px-4 md:px-8">
                <h3 className="text-2xl md:text-3xl font-tenor text-foreground leading-relaxed">
                  {gallery?.blocks?.portrait_left?.title || ""}
                </h3>
                <p className="text-base md:text-lg font-lato text-muted-foreground leading-relaxed">
                  {gallery?.blocks?.portrait_left?.caption || ""}
                </p>
              </div>
            </div>

            {/* Block 3: 3× Portrait Grid (9:16) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {gallery?.three_grid?.map((image, idx) => (
                  <div key={image.url || image.id} className="w-full aspect-[9/16] overflow-hidden">
                  <img
                    src={image?.image || ""}
                    alt={image.alt || ""}
                    className={`w-full h-full object-cover object-center hover:scale-103 transition-all duration-300 ease-out ${
                      inViewItems.has(`grid-${idx}`)
                        ? "scale-102 opacity-100"
                        : "scale-100 opacity-80"
                    }`}
                    loading="lazy"
                    decoding="async"
                    data-gallery-image
                    data-id={`grid-${idx}`}
                  />
                </div>
              ))}
            </div>

            {/* Block 4: 3:4 Portrait + Text (Image Right, Text Left) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4 px-4 md:px-8 md:order-1">
                <h3 className="text-2xl md:text-3xl font-tenor text-foreground leading-relaxed">
                  {gallery?.blocks?.portrait_right?.title || ""}
                </h3>
                <p className="text-base md:text-lg font-lato text-muted-foreground leading-relaxed">
                  {gallery?.blocks?.portrait_right?.caption || ""}
                </p>
              </div>
              <div className="w-full aspect-[3/4] overflow-hidden md:order-2">
                <img
                  src={gallery?.blocks?.portrait_right?.image || ""}
                  alt={gallery?.blocks?.portrait_right?.alt || ""}
                  className={`w-full h-full object-cover object-center hover:scale-103 transition-all duration-300 ease-out ${
                    inViewItems.has("portrait-right")
                      ? "scale-102 opacity-100"
                      : "scale-100 opacity-80"
                  }`}
                  loading="lazy"
                  decoding="async"
                  data-gallery-image
                  data-id="portrait-right"
                />
              </div>
            </div>

            {/* Block 5: Final 16:9 CTA Section */}
            <div className="relative w-full aspect-video overflow-hidden">
              <img
                src={gallery?.final_cta?.image || ""}
                alt={gallery?.final_cta?.alt || ""}
                className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-300 ease-out"
                loading="lazy"
                decoding="async"
                data-gallery-image
                data-id="final-cta"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  className="bg-transparent border border-white/90 text-white/90 hover:bg-[#F3EEE6] hover:text-[#2C2C2C] hover:border-[#2C2C2C] font-tenor tracking-wider px-8 py-6 text-base transition-all duration-500 rounded-none"
                  onClick={() => setIsExpanded(false)}
                >
                  COLLAPSE
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default GallerySection;
