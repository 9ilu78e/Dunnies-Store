import type { Metadata } from "next";
import ProductsCatalog from "@/components/product/ProductsCatalog";
import { type ProductRecord } from "@/Data/products";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "All Products – Dunnis Stores",
};

type ApiProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category?: string | null;
};

const adaptProductRecord = (product: ApiProduct, tag?: string): ProductRecord => ({
  id: product.id,
  name: product.name,
  description: product.description,
  longDescription: product.description,
  price: product.price,
  originalPrice: undefined,
  rating: 0,
  reviewsCount: 0,
  image: product.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
  images: [product.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"],
  tag: tag ?? product.category ?? "New",
  category: product.category ?? "General",
  href: `/product/${product.id}`,
  stockStatus: "in-stock",
  highlights: [],
  specs: [],
  reviews: [],
});

type ProductPageProps = {
  searchParams: Promise<{ category?: string }>;
};

async function fetchProductsByCategory(categoryId?: string): Promise<ProductRecord[]> {
  try {
    // If category is specified, get category details to determine type
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return [];
      }

      // Fetch products based on category type
      if (category.type === "gift") {
        const gifts = await prisma.gift.findMany({
          where: {},
          orderBy: { createdAt: "desc" },
        });
        return gifts.map((gift) =>
          adaptProductRecord(
            {
              id: gift.id,
              name: gift.name,
              description: gift.description || "",
              price: gift.price,
              imageUrl: gift.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
              category: category.name,
            },
            category.name
          )
        );
      } else if (category.type === "grocery") {
        const groceries = await prisma.grocery.findMany({
          where: {},
          orderBy: { createdAt: "desc" },
        });
        return groceries.map((grocery) =>
          adaptProductRecord(
            {
              id: grocery.id,
              name: grocery.name,
              description: grocery.description || "",
              price: grocery.price,
              imageUrl: grocery.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
              category: category.name,
            },
            category.name
          )
        );
      } else {
        // Product category
        const products = await prisma.product.findMany({
          where: { categoryId },
          include: { category: true },
          orderBy: { createdAt: "desc" },
        });
        return products.map((product) =>
          adaptProductRecord({
            id: product.id,
            name: product.name,
            description: product.description || "",
            price: product.price,
            imageUrl: product.imageUrl || "",
            category: product.category?.name,
          })
        );
      }
    }

    // Fetch all products from all tables
    const [products, gifts, groceries] = await Promise.all([
      prisma.product.findMany({
        include: { category: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.gift.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.grocery.findMany({
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const allProducts: ProductRecord[] = [];

    // Add products from Product table
    allProducts.push(
      ...products.map((product) =>
        adaptProductRecord({
          id: product.id,
          name: product.name,
          description: product.description || "",
          price: product.price,
          imageUrl: product.imageUrl || "",
          category: product.category?.name,
        })
      )
    );

    // Add gifts
    allProducts.push(
      ...gifts.map((gift) =>
        adaptProductRecord(
          {
            id: gift.id,
            name: gift.name,
            description: gift.description || "",
            price: gift.price,
            imageUrl: gift.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
            category: "Gifts",
          },
          "Gifts"
        )
      )
    );

    // Add groceries
    allProducts.push(
      ...groceries.map((grocery) =>
        adaptProductRecord(
          {
            id: grocery.id,
            name: grocery.name,
            description: grocery.description || "",
            price: grocery.price,
            imageUrl: grocery.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
            category: "Groceries",
          },
          "Groceries"
        )
      )
    );

    return allProducts;
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
}

export default async function ProductListingPage({
  searchParams,
}: ProductPageProps) {
  const { category } = await searchParams;
  const catalog = await fetchProductsByCategory(category);

  const pageTitle = category ? "Products by Category" : "All Products";
  const pageDescription = category 
    ? "View all products in this category" 
    : "Discover our full range of products curated for quality and value.";

  return (
    <section className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <div>
          <p className="text-sm font-semibold text-purple-600 uppercase tracking-widest">
            {category ? "Category" : "All Products"}
          </p>
          <h1 className="text-4xl font-bold text-gray-900 mt-1">
            {pageTitle === "Products by Category"
              ? `Browse Collection`
              : "Browse Our Complete Collection"}
          </h1>
          <p className="text-slate-600 mt-2">
            {pageDescription}
          </p>
        </div>
        {catalog.length > 0 ? (
          <ProductsCatalog products={catalog} />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No products available in this category. Please check back soon!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
