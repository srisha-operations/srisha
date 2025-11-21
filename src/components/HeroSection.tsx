import { ChevronLeft, ChevronRight, ChevronsDown } from "lucide-react";
import { Button } from "./ui/button";

const HeroSection = () => {
  return (
    <section className="w-full h-screen relative bg-muted overflow-hidden">
      {/* Full-Bleed Background Image Placeholder */}
      <div className="absolute inset-0 flex items-center justify-center bg-muted">
        <div className="text-center">
          <span className="font-tenor text-3xl lg:text-4xl text-foreground/40">IMAGE CAROUSEL</span>
          <span className="block font-lato text-sm text-foreground/30 mt-2">16:9</span>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button 
        className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 p-3 hover:opacity-60 transition-opacity z-20"
        aria-label="Previous image"
      >
        <ChevronLeft className="w-8 h-8 lg:w-10 lg:h-10 text-foreground" strokeWidth={1} />
      </button>

      <button 
        className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 p-3 hover:opacity-60 transition-opacity z-20"
        aria-label="Next image"
      >
        <ChevronRight className="w-8 h-8 lg:w-10 lg:h-10 text-foreground" strokeWidth={1} />
      </button>

      {/* Overlay Content Container */}
      <div className="relative h-full flex flex-col justify-between px-4 md:px-8 lg:px-16 xl:px-24 py-24 lg:py-32">
        
        {/* Vision Statement - Top Left */}
        <div className="w-full lg:w-1/3 text-left">
          <h1 className="font-tenor text-4xl lg:text-5xl xl:text-6xl text-foreground mb-4">
            Vision Statement
          </h1>
          <p className="font-lato text-base lg:text-lg text-foreground/80">
            Description
          </p>
        </div>

        {/* Bottom Content - CTA and Scroll Indicator */}
        <div className="flex flex-col items-center gap-12">
          {/* CTA Button */}
          <Button 
            variant="outline" 
            className="font-tenor px-8 py-6 text-base border-foreground bg-transparent hover:bg-background/10 text-foreground"
          >
            CTA BUTTON
          </Button>

          {/* Scroll Indicator */}
          <div className="flex flex-col items-center gap-2">
            <p className="font-lato text-sm text-foreground/70">Scroll down to explore</p>
            <ChevronsDown className="w-5 h-5 text-foreground/50" strokeWidth={1} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
