import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ProductDetail = () => {
  const { slug } = useParams();

  return (
    <div className="w-full">
      <Header />
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="w-full h-[500px] flex items-center justify-center border">
            Product Image Gallery Placeholder - {slug}
          </div>
          <div className="w-full h-[500px] flex flex-col justify-center border p-4">
            <div className="mb-4">Product Info Placeholder</div>
            <div className="mb-4">Product Title: {slug}</div>
            <div className="mb-4">Product Price Placeholder</div>
            <div className="mb-4">Product Description Placeholder</div>
            <div>Add to Cart Button Placeholder</div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProductDetail;
