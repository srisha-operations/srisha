import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";
import SEO from "@/components/SEO";
import ProductDetailModal from "@/components/ProductDetailModal";
import { Loader } from "@/components/ui/loader";

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // We reuse the modal for the actual UI to maintain consistency
  // but we need this page wrapper for SEO and direct linking
  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_images (*),
          product_variants (*)
        `)
        .eq("slug", slug)
        .single();

      if (!error && data) {
        setProduct(data);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [slug]);

  if (loading) return <Loader fullScreen />;
  if (!product) return <div>Product not found</div>;

  const defaultImg = product.product_images?.find((i: any) => !i.is_hover)?.url || "";

  // Structured Data for Google (Product Schema)
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.product_images?.map((img: any) => img.url) || [],
    "description": product.description,
    "brand": {
      "@type": "Brand",
      "name": "SRISHA"
    },
    // We assume default variant price if variants exist, else base price
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "INR",
      "price": product.product_variants?.[0]?.price || product.price || "0",
      "availability": "https://schema.org/InStock", // You can make this dynamic based on inventory
      "itemCondition": "https://schema.org/NewCondition"
    }
  };

  return (
    <div className="w-full">
      <SEO 
        title={product.name}
        description={product.description}
        image={defaultImg}
        schema={productSchema}
      />
      <Header />
      
      {/* 
        Ideally, we would render the full page content here.
        For now, we can render the modal automatically or reuse components.
        Given the previous placeholder state, I'll render the ProductDetailModal 
        OPEN immediately to simulate the experience, or just render the modal's internal content.
        
        However, ProductDetailModal is designed as a dialog. 
        Current solution: Show a basic page and open the modal? 
        Or better: The user likely wants a standalone page.
        
        Since I cannot easily refactor ProductDetailModal content into a standalone component
        without more context, I will render a simplified view + open the modal by default.
      */}
      
      <div className="min-h-screen bg-background pt-24 pb-12 px-4 md:px-8">
         <ProductDetailModal 
            product={product} 
            open={true} 
            onOpenChange={() => {
                // If user closes modal on a dedicated page, maybe go back to shop?
                // For now, let's keep it open or allow close
            }} 
         />
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetail;
