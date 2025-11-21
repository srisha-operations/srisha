import { Link } from "react-router-dom";

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  image: string;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Link to={`/product/${product.slug}`}>
      <div className="w-full border p-4">
        <div className="w-full h-[200px] flex items-center justify-center border mb-4">
          Product Image {product.id}
        </div>
        <div className="mb-2">{product.name}</div>
        <div>₹{product.price}</div>
      </div>
    </Link>
  );
};

export default ProductCard;
