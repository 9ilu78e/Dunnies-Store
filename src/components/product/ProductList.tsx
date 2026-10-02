import ProductCard from "./ProductCard";

interface Product {
  id: number | string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  image?: string;
  tag?: string;
  discount?: number;
  stockQuantity?: number;
  orderCount?: number;
  href?: string;
}

interface ProductListProps {
  products: Product[];
  cols?: 2 | 3 | 4 | 5 | 6;
  gap?: 4 | 6 | 8;
}

export default function ProductList({
  products,
  cols = 4,
  gap = 6,
}: ProductListProps) {
  const gapClass =
    gap === 4
      ? "gap-3 sm:gap-4"
      : gap === 8
      ? "gap-4 sm:gap-6"
      : "gap-4 sm:gap-5";

  const gridCols = {
    2: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
    3: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6",
    4: "grid-cols-2 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6",
    5: "grid-cols-2 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6",
    6: "grid-cols-2 md:grid-cols-4 lg:grid-cols-6",
  }[cols];

  return (
    <div className={`grid ${gridCols} ${gapClass} w-full auto-rows-max`}>
      {products.map((product) => (
        <ProductCard key={product.id} {...product} className="w-full h-full" />
      ))}
    </div>
  );
}
