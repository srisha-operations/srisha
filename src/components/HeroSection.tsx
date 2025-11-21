import { ChevronLeft, ChevronRight, ChevronsDown } from "lucide-react";
import { Button } from "./ui/button";

const HeroSection = () => {
  return (
    <section className="w-full min-h-screen bg-background flex flex-col">
      {/* Main Hero Content */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-between px-4 md:px-8 lg:px-16 xl:px-24 py-12 lg:py-0 gap-8 lg:gap-12">
        
        {/* Left Text Block */}
        <div className="w-full lg:w-1/4 text-left">
          <h1 className="font-tenor text-4xl lg:text-5xl text-foreground mb-4">
            Vision Statement
          </h1>
          <p className="font-lato text-base text-foreground/80">
            Description
          </p>
        </div>

        {/* Center Carousel Area with Arrows */}
        <div className="w-full lg:w-1/2 flex items-center justify-center gap-4 lg:gap-8">
          {/* Left Arrow */}
          <button 
            className="p-2 hover:opacity-60 transition-opacity"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-8 h-8 lg:w-10 lg:h-10 text-foreground" strokeWidth={1} />
          </button>

          {/* 16:9 Carousel Container */}
          <div className="w-full aspect-[16/9] bg-muted border border-border flex flex-col items-center justify-center">
            <span className="font-tenor text-2xl lg:text-3xl text-foreground">IMAGE CAROUSEL</span>
            <span className="font-lato text-sm text-muted-foreground mt-2">16:9</span>
          </div>

          {/* Right Arrow */}
          <button 
            className="p-2 hover:opacity-60 transition-opacity"
            aria-label="Next image"
          >
            <ChevronRight className="w-8 h-8 lg:w-10 lg:h-10 text-foreground" strokeWidth={1} />
          </button>
        </div>

        {/* Right Empty Space (for balance on desktop) */}
        <div className="hidden lg:block lg:w-1/4"></div>
      </div>

      {/* CTA Button - Below Carousel */}
      <div className="flex justify-center pb-8">
        <Button 
          variant="outline" 
          className="font-tenor px-8 py-6 text-base border-border hover:bg-secondary"
        >
          CTA BUTTON
        </Button>
      </div>

      {/* Scroll Indicator */}
      <div className="flex flex-col items-center pb-8 gap-2">
        <p className="font-lato text-sm text-foreground/70">Scroll down to explore</p>
        <ChevronsDown className="w-5 h-5 text-foreground/50" strokeWidth={1} />
      </div>
    </section>
  );
};

export default HeroSection;
