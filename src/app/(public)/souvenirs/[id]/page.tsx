import { notFound } from "next/navigation";
import ProductDetail from "@/components/product/ProductDetail";
import ProductDetailWrapper from "@/components/product/ProductDetailWrapper";
import { type ProductRecord } from "@/Data/products";
import { prisma } from "@/lib/prisma";

type SouvenirDetailPageProps = {
  params: Promise<{ id: string }>;
};

async function getSouvenirFromDatabase(id: string) {
  try {
    const souvenir = await prisma.souvenir.findUnique({
      where: { id },
    });

    if (souvenir) {
      // Fetch comments and likes separately
      const comments = await prisma.productComment.findMany({
        where: { productId: id },
      });
      const likes = await prisma.productLike.findMany({
        where: { productId: id },
      });

      return { ...souvenir, comments, likes };
    }

    return null;
  } catch (error) {
    return null;
  }
}

function transformDatabaseSouvenir(dbSouvenir: any): ProductRecord {
  console.log(
    `[SouvenirDetail] ${dbSouvenir.name}: imageUrl="${
      dbSouvenir.imageUrl
    }", imageUrls=${
      dbSouvenir.imageUrls ? `[${dbSouvenir.imageUrls.join(",")}]` : "[]"
    }`
  );

  // Calculate average rating from comments
  const ratings = (dbSouvenir.comments as any[]).map((c: any) => c.rating);
  const averageRating =
    ratings.length > 0
      ? Math.round(
          (ratings.reduce((a: number, b: number) => a + b, 0) /
            ratings.length) *
            10
        ) / 10
      : 0;

  // Prioritize imageUrls array first, then imageUrl, then unsplash default
  let imageUrls = [];
  if (
    dbSouvenir.imageUrls &&
    Array.isArray(dbSouvenir.imageUrls) &&
    dbSouvenir.imageUrls.length > 0
  ) {
    imageUrls = dbSouvenir.imageUrls.filter((url: string) => url && url.trim());
  }
  if (
    imageUrls.length === 0 &&
    dbSouvenir.imageUrl &&
    dbSouvenir.imageUrl.trim()
  ) {
    imageUrls = [dbSouvenir.imageUrl];
  }
  if (imageUrls.length === 0) {
    imageUrls = [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    ];
  }

  return {
    id: dbSouvenir.id,
    name: dbSouvenir.name,
    description: dbSouvenir.description || "",
    longDescription: dbSouvenir.description || "",
    price: dbSouvenir.price,
    originalPrice: undefined,
    rating: averageRating,
    reviewsCount: dbSouvenir.comments.length,
    image: imageUrls[0],
    images: imageUrls,
    tag: "Souvenir",
    category: "Souvenirs",
    href: `/souvenirs/${dbSouvenir.id}`,
    stockStatus: "in-stock" as const,
    highlights: ["Locally inspired", "Giftable keepsake", "Made to remember"],
    specs: [
      { label: "SKU", value: dbSouvenir.id },
      { label: "Category", value: "Souvenirs" },
    ],
    reviews: [],
  };
}

export default async function SouvenirDetailPage({
  params,
}: SouvenirDetailPageProps) {
  const { id } = await params;

  let dbSouvenir = await getSouvenirFromDatabase(id);
  let product: ProductRecord | null = null;

  if (dbSouvenir) {
    product = transformDatabaseSouvenir(dbSouvenir);
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
