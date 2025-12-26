import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import images from "@/data/images.json";
import content from "@/data/content.json";

const GallerySection = ({ gallery }: { gallery: any }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inViewItems, setInViewItems] = useState<Set<string>>(new Set());
  const sectionRef = useRef<HTMLElement>(null);

  // Set up intersection observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("data-id");
          if (!id) return;

          if (entry.isIntersecting) {
            setInViewItems((prev) => new Set([...prev, id]));
          }
          // Intentionally removed the 'else' block so items stay visible once revealed
        });
      },
      { threshold: 0.2 } // Trigger sooner
    );

    // Observe all gallery images and text blocks
    const elements = document.querySelectorAll("[data-gallery-animate]");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [isExpanded]);

  const getAnimationClass = (id: string, delay: string = "0ms") => {
    const isVisible = inViewItems.has(id);
    return `transition-all duration-1000 ease-out transform ${
      isVisible
        ? "opacity-100 translate-y-0 scale-100 blur-0"
        : "opacity-0 translate-y-12 scale-95 blur-[2px]"
    }`;
  };

  const handleCollapse = () => {
    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
    // Small timeout to allow scroll to start before content disappears?
    // Actually immediate state change is fine, browser will scroll to the element's new position/layout.
    setIsExpanded(false);
  };

  return (
    <section 
      ref={sectionRef}
      className="w-full bg-background py-[30px] scroll-mt-24" // Added scroll-mt to handle potential sticky headers
    >
      <div className="container mx-auto px-4">
        {/* Section Title with Collapse Toggle */}
        <div className="flex items-center justify-center mb-12 md:mb-12 relative">
          <h2 className="text-3xl md:text-4xl font-tenor text-center text-foreground">
            {gallery.title}
          </h2>
          {isExpanded && (
            <button
              onClick={handleCollapse}
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
              className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-1000 ease-out"
              loading="lazy"
              data-gallery-animate
              data-id="hero-block"
            />

            {!isExpanded && (
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/50 flex items-center justify-center transition-opacity duration-1000">
                <Button
                  onClick={() => setIsExpanded(true)}
                  className="bg-transparent border border-white/90 text-white/90 hover:bg-[#F3EEE6] hover:text-[#2C2C2C] hover:border-[#2C2C2C] font-tenor tracking-wider px-8 py-6 text-base transition-all duration-500 rounded-none transform hover:translate-y-[-2px]"
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
              <div className="w-full aspect-[4/5] overflow-hidden overflow-y-hidden">
                <img
                  src={gallery?.blocks?.portrait_left?.image || ""}
                  alt={gallery?.blocks?.portrait_left?.alt || ""}
                  className={`w-full h-full object-cover object-center hover:scale-105 ${getAnimationClass("portrait-left")}`}
                  loading="lazy"
                  decoding="async"
                  data-gallery-animate
                  data-id="portrait-left"
                />
              </div>
              <div 
                className={`flex flex-col justify-center space-y-4 px-4 md:px-8 ${getAnimationClass("text-left")}`}
                data-gallery-animate
                data-id="text-left"
              >
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
                    className={`w-full h-full object-cover object-center hover:scale-105 ${getAnimationClass(`grid-${idx}`)}`}
                    style={{ transitionDelay: `${idx * 150}ms` }}
                    loading="lazy"
                    decoding="async"
                    data-gallery-animate
                    data-id={`grid-${idx}`}
                  />
                </div>
              ))}
            </div>

            {/* Block 4: 3:4 Portrait + Text (Image Right, Text Left) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div 
                className={`flex flex-col justify-center space-y-4 px-4 md:px-8 md:order-1 ${getAnimationClass("text-right")}`}
                data-gallery-animate
                data-id="text-right"
              >
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
                  className={`w-full h-full object-cover object-center hover:scale-105 ${getAnimationClass("portrait-right")}`}
                  loading="lazy"
                  decoding="async"
                  data-gallery-animate
                  data-id="portrait-right"
                />
              </div>
            </div>

            {/* Block 5: Final 16:9 CTA Section */}
            <div className="relative w-full aspect-video overflow-hidden">
              <img
                src={gallery?.final_cta?.image || ""}
                alt={gallery?.final_cta?.alt || ""}
                className={`w-full h-full object-cover object-center hover:scale-105 ${getAnimationClass("final-cta")}`}
                loading="lazy"
                decoding="async"
                data-gallery-animate
                data-id="final-cta"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  className="bg-transparent border border-white/90 text-white/90 hover:bg-[#F3EEE6] hover:text-[#2C2C2C] hover:border-[#2C2C2C] font-tenor tracking-wider px-8 py-6 text-base transition-all duration-500 rounded-none transform hover:translate-y-[-2px]"
                  onClick={handleCollapse}
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
