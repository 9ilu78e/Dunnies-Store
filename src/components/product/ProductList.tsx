"use client";

import ProductCard from "./ProductCard";

interface Product {
  id?: string | number;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  image?: string;
  tag?: string;
  discount?: number;
  href?: string;
}

interface ProductListProps {
  products: Product[];
  cols?: 1 | 2 | 3 | 4;
  gap?: 4 | 6 | 8;
}

export default function ProductList({
  products,
  cols = 3,
  gap = 6,
}: ProductListProps) {
  const colsMap = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  };

  const gapMap = {
    4: "gap-4",
    6: "gap-6",
    8: "gap-8",
  };

  return (
    <div className={`grid ${colsMap[cols]} ${gapMap[gap]}`}>
      {products.map((product, idx) => (
        <ProductCard
          key={product.id || idx}
          name={product.name}
          description={product.description}
          price={product.price}
          originalPrice={product.originalPrice}
          rating={product.rating}
          reviews={product.reviews}
          image={product.image}
          tag={product.tag}
          discount={product.discount}
          href={product.href}
        />
      ))}
    </div>
  );
}
