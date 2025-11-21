import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import GallerySection from "@/components/GallerySection";
import ProductListingSection from "@/components/ProductListingSection";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="w-full">
      <Header />
      <HeroSection />
      <GallerySection />
      <ProductListingSection />
      <AboutSection />
      <Footer />
    </div>
  );
};

export default Index;
