import { useEffect, useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import GallerySection from "@/components/GallerySection";
import ProductListingSection from "@/components/ProductListingSection";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";

import SEO from "@/components/SEO";

const Index = () => {
  const [hero, setHero] = useState<any>(null);
  const [gallery, setGallery] = useState<any>(null);

  useEffect(() => {
    const loadContent = async () => {
      // Hero
      const { data: heroData, error: heroError } = await supabase
        .from("site_content")
        .select("value")
        .eq("key", "hero")
        .single();

      if (!heroError) setHero(heroData?.value);

      // Gallery
      const { data: galleryData, error: galleryError } = await supabase
        .from("site_content")
        .select("value")
        .eq("key", "gallery")
        .single();

      if (!galleryError) setGallery(galleryData?.value);
    };

    loadContent();
  }, []);

  return (
    <div className="w-full">
      <SEO 
        title="Home" 
        description="SRISHA - Discover luxury ethnic wear and contemporary fashion." 
      />
      <Header />
      
      {/* render hero section only when data loaded */}
      {hero && <HeroSection hero={hero} />}

      {/* same for gallery */}
      {gallery && <GallerySection gallery={gallery} />}

      <ProductListingSection />
      <AboutSection />
      <Footer />
    </div>
  );
};

export default Index;
