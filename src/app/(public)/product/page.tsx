import type { Metadata } from "next";
import ProductsCatalog from "@/components/catalog/ProductsCatalog";
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
  stockQuantity?: number;
  imageUrl: string;
  imageUrls?: string[];
  category?: string | null;
  rating?: number;
  reviewsCount?: number;
  likesCount?: number;
  flashSalePrice?: number | null;
  flashSaleEndsAt?: string | Date | null;
};

const adaptProductRecord = (
  product: ApiProduct,
  tag?: string
): ProductRecord => {
  const saleEndTime = product.flashSaleEndsAt
    ? new Date(product.flashSaleEndsAt).getTime()
    : 0;
  const isFlashSaleActive =
    typeof product.flashSalePrice === "number" &&
    product.flashSalePrice > 0 &&
    saleEndTime > Date.now();
  // Prioritize imageUrls array, fallback to imageUrl, then default
  const imageUrls =
    product.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls
      : product.imageUrl
      ? [product.imageUrl]
      : [
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
        ];

  // Debug log
  if (
    !product.imageUrl &&
    (!product.imageUrls || product.imageUrls.length === 0)
  ) {
    console.log(
      `[ProductPage] ${product.name}: Using fallback image (no imageUrl or imageUrls)`
    );
  } else if (product.imageUrls && product.imageUrls.length > 0) {
    console.log(
      `[ProductPage] ${product.name}: Using ${product.imageUrls.length} images from imageUrls`
    );
  }

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    longDescription: product.description,
    price: isFlashSaleActive
      ? product.flashSalePrice ?? product.price
      : product.price,
    stockQuantity: product.stockQuantity,
    originalPrice: isFlashSaleActive ? product.price : undefined,
    rating: product.rating ?? 0,
    reviewsCount: product.reviewsCount ?? 0,
    image: imageUrls[0],
    images: imageUrls,
    tag: tag ?? product.category ?? "New",
    category: product.category ?? "General",
    href: `/product/${product.id}`,
    stockStatus: "in-stock",
    highlights: [],
    specs: [],
    reviews: [],
  };
};

type ProductPageProps = {
  searchParams: Promise<{
    category?: string;
    categoryName?: string;
    search?: string;
  }>;
};

async function fetchProductsByCategory(
  categoryId?: string,
  categoryName?: string
): Promise<ProductRecord[]> {
  try {
    if (categoryId || categoryName) {
      const category = categoryId
        ? await prisma.category.findUnique({ where: { id: categoryId } })
        : await prisma.category.findFirst({
            where: {
              name: { equals: categoryName ?? "", mode: "insensitive" },
              type: "gift",
              isActive: true,
            },
          });

      if (!category) {
        return [];
      }

      if (category.type === "gift") {
        const gifts = await prisma.gift.findMany({
          where: { categoryId },
          include: { category: true },
          orderBy: { createdAt: "desc" },
        });
        return gifts.map((gift: any) =>
          adaptProductRecord(
            {
              id: gift.id,
              name: gift.name,
              description: gift.description || "",
              price: gift.price,
              stockQuantity: gift.stockQuantity,
              imageUrl: gift.imageUrl || "",
              imageUrls:
                gift.imageUrls && gift.imageUrls.length > 0
                  ? gift.imageUrls
                  : undefined,
              category: gift.category?.name || category.name,
            },
            category.name
          )
        );
      } else if (category.type === "souvenir") {
        const souvenirs = await prisma.souvenir.findMany({
          where: { categoryId },
          include: { category: true },
          orderBy: { createdAt: "desc" },
        });
        return souvenirs.map((souvenir: any) =>
          adaptProductRecord(
            {
              id: souvenir.id,
              name: souvenir.name,
              description: souvenir.description || "",
              price: souvenir.price,
              stockQuantity: souvenir.stockQuantity,
              imageUrl: souvenir.imageUrl || "",
              imageUrls:
                souvenir.imageUrls && souvenir.imageUrls.length > 0
                  ? souvenir.imageUrls
                  : undefined,
              category: souvenir.category?.name || category.name,
            },
            category.name
          )
        );
      } else {
        const products = await prisma.product.findMany({
          where: { categoryId },
          include: { category: true, comments: true },
          orderBy: { createdAt: "desc" },
        });
        return products.map((product: any) => {
          // Calculate average rating from comments
          const ratings = product.comments.map((c: any) => c.rating);
          const averageRating =
            ratings.length > 0
              ? Math.round(
                  (ratings.reduce((a: number, b: number) => a + b, 0) /
                    ratings.length) *
                    10
                ) / 10
              : 0;

          return adaptProductRecord({
            id: product.id,
            name: product.name,
            description: product.description || "",
            price: product.price,
            stockQuantity: product.stockQuantity,
            imageUrl: product.imageUrl || "",
            imageUrls:
              product.imageUrls && product.imageUrls.length > 0
                ? product.imageUrls
                : undefined,
            category: product.category?.name,
            flashSalePrice: product.flashSalePrice,
            flashSaleEndsAt: product.flashSaleEndsAt,
            rating: averageRating,
            reviewsCount: product.comments.length,
          });
        });
      }
    }

    const [products, gifts, souvenirs] = await Promise.all([
      prisma.product.findMany({
        include: { category: true, comments: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.gift.findMany({
        include: { category: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.souvenir.findMany({
        include: { category: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const allProducts: ProductRecord[] = [];

    allProducts.push(
      ...products.map((product: any) => {
        // Calculate average rating from comments
        const ratings = product.comments.map((c: any) => c.rating);
        const averageRating =
          ratings.length > 0
            ? Math.round(
                (ratings.reduce((a: number, b: number) => a + b, 0) /
                  ratings.length) *
                  10
              ) / 10
            : 0;

        return adaptProductRecord({
          id: product.id,
          name: product.name,
          description: product.description || "",
          price: product.price,
          stockQuantity: product.stockQuantity,
          imageUrl: product.imageUrl || "",
          imageUrls:
            product.imageUrls && product.imageUrls.length > 0
              ? product.imageUrls
              : undefined,
          category: product.category?.name,
          flashSalePrice: product.flashSalePrice,
          flashSaleEndsAt: product.flashSaleEndsAt,
          rating: averageRating,
          reviewsCount: product.comments.length,
        });
      })
    );

    allProducts.push(
      ...gifts.map((gift: any) =>
        adaptProductRecord(
          {
            id: gift.id,
            name: gift.name,
            description: gift.description || "",
            price: gift.price,
            stockQuantity: gift.stockQuantity,
            imageUrl: gift.imageUrl || "",
            imageUrls:
              gift.imageUrls && gift.imageUrls.length > 0
                ? gift.imageUrls
                : undefined,
            category: gift.category?.name || "Gifts",
          },
          gift.category?.name || "Gifts"
        )
      )
    );

    allProducts.push(
      ...souvenirs.map((souvenir: any) =>
        adaptProductRecord(
          {
            id: souvenir.id,
            name: souvenir.name,
            description: souvenir.description || "",
            price: souvenir.price,
            stockQuantity: souvenir.stockQuantity,
            imageUrl: souvenir.imageUrl || "",
            imageUrls:
              souvenir.imageUrls && souvenir.imageUrls.length > 0
                ? souvenir.imageUrls
                : undefined,
            category: souvenir.category?.name || "Souvenirs",
          },
          souvenir.category?.name || "Souvenirs"
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
  const { category, categoryName, search = "" } = await searchParams;
  const catalog = await fetchProductsByCategory(category, categoryName);
  const categoryLabel = categoryName?.trim();

  const hasCategory = Boolean(category || categoryLabel);
  const pageTitle = hasCategory ? "Products by Category" : "All Products";
  const pageDescription = hasCategory
    ? "View all products in this category"
    : "Discover our full range of products curated for quality and value.";

  return (
    <section className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <div>
          <p className="text-sm font-semibold text-purple-600 uppercase tracking-widest">
            {hasCategory ? "Category" : "All Products"}
          </p>
          <h1 className="text-4xl font-bold text-gray-900 mt-1">
            {pageTitle === "Products by Category"
              ? categoryLabel
                ? `Browse ${categoryLabel}`
                : `Browse Collection`
              : "Browse Our Complete Collection"}
          </h1>
          <p className="text-slate-600 mt-2">{pageDescription}</p>
        </div>
        <ProductsCatalog products={catalog} initialSearchQuery={search} />
      </div>
    </section>
  );
}
