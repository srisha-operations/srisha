import { useState } from "react";
import { Button } from "@/components/ui/button";

const GallerySection = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Section Title */}
        <h2 className="text-3xl md:text-4xl font-tenor text-center text-foreground mb-16 md:mb-24">
          Gallery
        </h2>

        {/* Block 1: Collapsible 16:9 Hero */}
        <div className="relative w-full mb-16 md:mb-24">
          <div className="relative w-full aspect-video overflow-hidden">
            <img
              src="/public/assets/demo1.jpg"
              alt="Gallery hero"
              className="w-full h-full object-cover object-center transition-all duration-700"
            />
            {!isExpanded && (
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/50 flex items-center justify-center transition-opacity duration-700">
                <Button
                  onClick={() => setIsExpanded(true)}
                  className="bg-transparent border border-white/90 text-white/90 hover:bg-[#F3EEE6] hover:text-[#2C2C2C] hover:border-[#2C2C2C] font-tenor tracking-wider px-8 py-6 text-base transition-all duration-500"
                >
                  VIEW GALLERY
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
                  src="/public/assets/demo2.jpg"
                  alt="Gallery portrait 1"
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <div className="flex flex-col justify-center space-y-4 px-4 md:px-8">
                <h3 className="text-2xl md:text-3xl font-tenor text-foreground leading-relaxed">
                  Timeless Elegance
                </h3>
                <p className="text-base md:text-lg font-lato text-muted-foreground leading-relaxed">
                  Each piece in our collection tells a story of craftsmanship and dedication. 
                  We believe in creating garments that transcend trends and become cherished 
                  heirlooms for generations to come.
                </p>
              </div>
            </div>

            {/* Block 3: 3× Portrait Grid (9:16) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {[1, 2, 3].map((item) => (
                <div key={item} className="w-full aspect-[9/16] overflow-hidden">
                  <img
                    src={`/public/assets/demo${item}.jpg`}
                    alt={`Gallery portrait ${item + 1}`}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              ))}
            </div>

            {/* Block 4: 3:4 Portrait + Text (Image Right, Text Left) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4 px-4 md:px-8 md:order-1">
                <h3 className="text-2xl md:text-3xl font-tenor text-foreground leading-relaxed">
                  Heritage & Innovation
                </h3>
                <p className="text-base md:text-lg font-lato text-muted-foreground leading-relaxed">
                  Drawing inspiration from traditional techniques while embracing modern 
                  aesthetics, our designs celebrate the perfect balance between heritage 
                  and contemporary style.
                </p>
              </div>
              <div className="w-full aspect-[3/4] overflow-hidden md:order-2">
                <img
                  src="/public/assets/demo3.jpg"
                  alt="Gallery portrait 4"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>

            {/* Block 5: Final 16:9 CTA Section */}
            <div className="relative w-full aspect-video overflow-hidden">
              <img
                src="/public/assets/demo1.jpg"
                alt="Shop now"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  className="bg-transparent border border-white/90 text-white/90 hover:bg-[#F3EEE6] hover:text-[#2C2C2C] hover:border-[#2C2C2C] font-tenor tracking-wider px-8 py-6 text-base transition-all duration-500"
                  onClick={() => window.location.href = '/'}
                >
                  SHOP NOW
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
