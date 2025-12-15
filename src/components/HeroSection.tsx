import { ChevronLeft, ChevronRight, ChevronsDown } from "lucide-react";
import { Button } from "./ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselApi,
} from "./ui/carousel";
import { useEffect, useState } from "react";

const HeroSection = ({ hero }: { hero: any }) => {
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api) return;

    // Auto-slide every 6 seconds
    const interval = setInterval(() => {
      api.scrollNext();
    }, 6000);

    return () => clearInterval(interval);
  }, [api]);

  return (
    <section id="hero" className="w-full h-screen relative overflow-hidden">
      {/* Full-Bleed Background Carousel */}
      <Carousel
        setApi={setApi}
        opts={{ loop: true }}
        className="absolute inset-0"
      >
        <CarouselContent className="h-screen -ml-0">
          {hero?.images?.map((image, index) => (
            <CarouselItem key={image || index} className="h-screen pl-0">
              <div className="relative h-full w-full">
                <img
                  src={image}
                  alt={`hero-image-${index}`}
                  className="w-full h-full object-cover object-center transition-opacity duration-700"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation Arrows */}
        <CarouselPrevious className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 bg-transparent border-none hover:bg-white/20 hover:opacity-80 transition-all duration-300 z-20 h-auto w-auto p-3">
          <ChevronLeft
            className="w-6 h-6 lg:w-8 lg:h-8 text-white/90"
            strokeWidth={1}
          />
        </CarouselPrevious>
        <CarouselNext className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 bg-transparent border-none hover:bg-white/20 hover:opacity-80 transition-all duration-300 z-20 h-auto w-auto p-3">
          <ChevronRight
            className="w-6 h-6 lg:w-8 lg:h-8 text-white/90"
            strokeWidth={1}
          />
        </CarouselNext>
      </Carousel>

      {/* Overlay Content Container */}
      <div className="relative h-full flex flex-col justify-end items-center px-4 md:px-8 pb-16 md:pb-20 lg:justify-between lg:items-start lg:pt-40 lg:pb-24 lg:px-16 xl:px-24">
        {/* Vision Statement - Mobile: above button, Desktop: left side */}
        <div className="w-full text-center mb-8 lg:w-1/3 lg:text-left lg:mb-0 lg:order-first">
          <h1 className="font-tenor text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-white/90 mb-3 lg:mb-4">
            {hero?.heading}
          </h1>
          <p className="font-lato text-sm md:text-base lg:text-lg text-white/80">
            {hero?.subheading}
          </p>
        </div>

        {/* Bottom Content - CTA and Scroll Indicator */}
        <div className="flex flex-col items-center gap-8 lg:gap-12 lg:self-center">
          {/* CTA Button */}
          <Button
            onClick={() => {
              const section = document.getElementById("product-listing");
              section?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="font-tenor px-10 py-6 text-base border border-white/90 bg-transparent hover:bg-[#F3EEE6] text-white/90 hover:text-[#2C2C2C] tracking-wider transition-all duration-500 rounded-none"
          >
            {hero?.cta}
          </Button>

          {/* Scroll Indicator */}
          <div className="flex flex-col items-center gap-2 animate-bounce-slow">
            <p className="font-lato text-sm text-white/70">
              Scroll down to explore
            </p>
            <ChevronsDown className="w-5 h-5 text-white/60" strokeWidth={1} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
