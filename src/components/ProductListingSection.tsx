import ProductCard from "./ProductCard";
import { products } from "@/data/products";

const ProductListingSection = () => {
  return (
    <section className="w-full p-8">
      <div className="container mx-auto">
        <h2 className="text-xl mb-4">Product Listing Section</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductListingSection;
