import { notFound } from "next/navigation";
import ProductDetail from "@/components/product/ProductDetail";
import ProductDetailWrapper from "@/components/product/ProductDetailWrapper";
import {
  getProductById as getLocalProductById,
  ProductRecord,
} from "@/Data/products";
import { prisma } from "@/lib/prisma";
import { readSizeVariants } from "@/lib/sizeVariants";

type ProductDetailPageProps = {
  params: Promise<{ id: string }>;
};

async function getProductFromDatabase(id: string) {
  try {
    let product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        comments: { select: { rating: true } },
      },
    });

    if (product) return product;

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

    const souvenir = await prisma.souvenir.findUnique({
      where: { id },
      include: { category: true },
    });

    if (souvenir) {
      return {
        ...souvenir,
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

function transformDatabaseProduct(dbProduct: any): ProductRecord {
  const ratings = (dbProduct.comments || []).map(
    (comment: { rating: number }) => comment.rating
  );
  const averageRating =
    ratings.length > 0
      ? Math.round(
          (ratings.reduce((sum: number, rating: number) => sum + rating, 0) /
            ratings.length) *
            10
        ) / 10
      : 0;
  const flashSaleEndsAt = dbProduct.flashSaleEndsAt
    ? new Date(dbProduct.flashSaleEndsAt).getTime()
    : 0;
  const isFlashSaleActive =
    typeof dbProduct.flashSalePrice === "number" &&
    dbProduct.flashSalePrice > 0 &&
    flashSaleEndsAt > Date.now();

  console.log(
    `[ProductDetail] ${dbProduct.name}: imageUrl="${
      dbProduct.imageUrl
    }", imageUrls=${
      dbProduct.imageUrls ? `[${dbProduct.imageUrls.join(",")}]` : "[]"
    }`
  );

  // Prioritize imageUrls array first, then imageUrl, then unsplash default
  let imageUrls = [];
  if (
    dbProduct.imageUrls &&
    Array.isArray(dbProduct.imageUrls) &&
    dbProduct.imageUrls.length > 0
  ) {
    imageUrls = dbProduct.imageUrls.filter((url: string) => url && url.trim());
  }
  if (
    imageUrls.length === 0 &&
    dbProduct.imageUrl &&
    dbProduct.imageUrl.trim()
  ) {
    imageUrls = [dbProduct.imageUrl];
  }
  if (imageUrls.length === 0) {
    imageUrls = [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    ];
  }

  return {
    id: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description || "",
    longDescription: dbProduct.description || "",
    price: isFlashSaleActive ? dbProduct.flashSalePrice : dbProduct.price,
    stockQuantity: dbProduct.stockQuantity,
    sizeVariants: readSizeVariants(dbProduct.sizeVariants),
    originalPrice: isFlashSaleActive ? dbProduct.price : undefined,
    rating: averageRating,
    reviewsCount: ratings.length,
    image: imageUrls[0],
    images: imageUrls,
    tag: isFlashSaleActive ? "Flash Sale" : dbProduct.priority || "New",
    category: dbProduct.category?.name || "Uncategorized",
    href: `/product/${dbProduct.id}`,
    stockStatus:
      dbProduct.stockQuantity <= 0
        ? ("out-of-stock" as const)
        : dbProduct.stockQuantity <= 5
        ? ("low-stock" as const)
        : ("in-stock" as const),
    highlights: ["Premium quality", "Fast delivery", "Customer approved"],
    specs: [
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
