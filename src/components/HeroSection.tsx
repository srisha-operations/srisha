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
import { HeroContent } from "@/types/content";

const HeroSection = ({ hero }: { hero: HeroContent }) => {
  const [desktopApi, setDesktopApi] = useState<CarouselApi>();
  const [mobileApi, setMobileApi] = useState<CarouselApi>();

  // Auto-slide for Desktop
  useEffect(() => {
    if (!desktopApi) return;

    const interval = setInterval(() => {
      desktopApi.scrollNext();
    }, 6000);

    return () => clearInterval(interval);
  }, [desktopApi]);

  // Auto-slide for Mobile
  useEffect(() => {
    if (!mobileApi) return;

    const interval = setInterval(() => {
      mobileApi.scrollNext();
    }, 6000);

    return () => clearInterval(interval);
  }, [mobileApi]);

  const mobileImages = hero?.mobileImages?.length ? hero.mobileImages : hero?.images;

  return (
    <section id="hero" className="w-full h-screen relative overflow-hidden">
      {/* Desktop Carousel (Hidden on Mobile) */}
      <div className="hidden md:block absolute inset-0">
        <Carousel
          setApi={setDesktopApi}
          opts={{ loop: true }}
          className="w-full h-full"
        >
          <CarouselContent className="h-screen -ml-0">
            {hero?.images?.map((image, index) => (
              <CarouselItem key={`desktop-${index}`} className="h-screen pl-0">
                <div className="relative h-full w-full">
                  <img
                    src={image}
                    alt={`hero-desktop-${index}`}
                    className="w-full h-full object-cover object-center transition-opacity duration-700"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation Arrows - Desktop Only */}
          <CarouselPrevious className="absolute left-8 top-1/2 -translate-y-1/2 bg-transparent border-none hover:bg-white/20 hover:opacity-80 transition-all duration-300 z-20 h-auto w-auto p-3">
            <ChevronLeft
              className="w-8 h-8 text-white/90"
              strokeWidth={1}
            />
          </CarouselPrevious>
          <CarouselNext className="absolute right-8 top-1/2 -translate-y-1/2 bg-transparent border-none hover:bg-white/20 hover:opacity-80 transition-all duration-300 z-20 h-auto w-auto p-3">
            <ChevronRight
              className="w-8 h-8 text-white/90"
              strokeWidth={1}
            />
          </CarouselNext>
        </Carousel>
      </div>

      {/* Mobile Carousel (Hidden on Desktop) */}
      <div className="block md:hidden absolute inset-0">
        <Carousel
          setApi={setMobileApi}
          opts={{ loop: true }}
          className="w-full h-full"
        >
          <CarouselContent className="h-screen -ml-0">
            {mobileImages?.map((image, index) => (
              <CarouselItem key={`mobile-${index}`} className="h-screen pl-0">
                <div className="relative h-full w-full">
                  <img
                    src={image}
                    alt={`hero-mobile-${index}`}
                    className="w-full h-full object-cover object-center transition-opacity duration-700"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* Simplified Navigation for Mobile if needed, or omit for cleaner look. 
              Keeping arrows for consistency but can be adjusted. */}
           <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 bg-transparent border-none hover:bg-white/20 hover:opacity-80 transition-all duration-300 z-20 h-auto w-auto p-2">
            <ChevronLeft
              className="w-6 h-6 text-white/90"
              strokeWidth={1}
            />
          </CarouselPrevious>
          <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none hover:bg-white/20 hover:opacity-80 transition-all duration-300 z-20 h-auto w-auto p-2">
            <ChevronRight
              className="w-6 h-6 text-white/90"
              strokeWidth={1}
            />
          </CarouselNext>
        </Carousel>
      </div>

      {/* Overlay Content Container */}
      <div className="relative h-full flex flex-col justify-end items-center px-4 md:px-8 pb-16 md:pb-20 lg:justify-between lg:items-start lg:pt-40 lg:pb-24 lg:px-16 xl:px-24 pointer-events-none">
        {/* Vision Statement - Mobile: above button, Desktop: left side */}
        <div className="w-full text-center mb-8 lg:w-1/3 lg:text-left lg:mb-0 lg:order-first pointer-events-auto">
          <h1 className="font-tenor text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-white/90 mb-3 lg:mb-4">
            {hero?.heading}
          </h1>
          <p className="font-lato text-sm md:text-base lg:text-lg text-white/80">
            {hero?.subheading}
          </p>
        </div>

        {/* Bottom Content - CTA and Scroll Indicator */}
        <div className="flex flex-col items-center gap-8 lg:gap-12 lg:self-center pointer-events-auto">
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

