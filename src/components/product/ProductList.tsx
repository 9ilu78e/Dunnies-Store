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
  const gapClass = gap === 4 ? "gap-4" : gap === 8 ? "gap-8" : "gap-6";

  const gridCols = {
    2: "grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    3: "grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    4: "grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    5: "grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
    6: "grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
  }[cols];

  return (
    <div className={`grid ${gridCols} ${gapClass} w-full auto-rows-max`}>
      {products.map((product) => (
        <ProductCard key={product.id} {...product} className="w-full h-full" />
      ))}
    </div>
  );
}
