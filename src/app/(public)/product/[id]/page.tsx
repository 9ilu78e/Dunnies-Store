import { notFound } from "next/navigation";
import ProductDetail from "@/components/product/ProductDetail";
import ProductDetailWrapper from "@/components/product/ProductDetailWrapper";
import { getProductById as getLocalProductById, ProductRecord } from "@/Data/products";
import { prisma } from "@/lib/prisma";

type ProductDetailPageProps = {
  params: Promise<{ id: string }>;
};

async function getProductFromDatabase(id: string) {
  try {
    // Try Product table first
    let product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    
    if (product) return product;
    
    // Try Gift table if not found
    const gift = await prisma.gift.findUnique({
      where: { id },
    });
    
    if (gift) {
      return {
        ...gift,
        categoryId: null,
        category: null,
        priority: "normal",
      };
    }
    
    // Try Grocery table if still not found
    const grocery = await prisma.grocery.findUnique({
      where: { id },
    });
    
    if (grocery) {
      return {
        ...grocery,
        categoryId: null,
        category: null,
        priority: "normal",
      };
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// Transform database product to match ProductRecord format
function transformDatabaseProduct(dbProduct: any): ProductRecord {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description || "",
    longDescription: dbProduct.description || "",
    price: dbProduct.price,
    originalPrice: undefined,
    rating: 4.5,
    reviewsCount: 0,
    image: dbProduct.imageUrl || "",
    images: dbProduct.imageUrl ? [dbProduct.imageUrl] : ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"],
    tag: dbProduct.priority || "New",
    category: dbProduct.category?.name || "Uncategorized",
    href: `/product/${dbProduct.id}`,
    stockStatus: "in-stock" as const,
    highlights: [
      "Premium quality",
      "Fast delivery",
      "Customer approved",
    ],
    specs: [
      { label: "SKU", value: dbProduct.id },
      { label: "Category", value: dbProduct.category?.name || "General" },
    ],
    reviews: [],
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;
  
  let dbProduct = await getProductFromDatabase(id);
  let product: ProductRecord | null = null;
  
  if (dbProduct) {
    product = transformDatabaseProduct(dbProduct);
  } else {
    product = getLocalProductById(id);
  }

  if (!product) {
    return notFound();
  }

  return (
    <ProductDetailWrapper>
      <section className="bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <ProductDetail product={product} />
        </div>
      </section>
    </ProductDetailWrapper>
  );
}



