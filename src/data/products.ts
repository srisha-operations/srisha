export interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  image: string;
  description: string;
}

export const products: Product[] = [
  {
    id: 1,
    name: "Product 1",
    slug: "product-1",
    price: 1999,
    image: "/placeholders/product-1.jpg",
    description: "Product 1 description placeholder",
  },
  {
    id: 2,
    name: "Product 2",
    slug: "product-2",
    price: 2999,
    image: "/placeholders/product-2.jpg",
    description: "Product 2 description placeholder",
  },
  {
    id: 3,
    name: "Product 3",
    slug: "product-3",
    price: 3999,
    image: "/placeholders/product-3.jpg",
    description: "Product 3 description placeholder",
  },
  {
    id: 4,
    name: "Product 4",
    slug: "product-4",
    price: 4999,
    image: "/placeholders/product-4.jpg",
    description: "Product 4 description placeholder",
  },
  {
    id: 5,
    name: "Product 5",
    slug: "product-5",
    price: 5999,
    image: "/placeholders/product-5.jpg",
    description: "Product 5 description placeholder",
  },
  {
    id: 6,
    name: "Product 6",
    slug: "product-6",
    price: 6999,
    image: "/placeholders/product-6.jpg",
    description: "Product 6 description placeholder",
  },
];
