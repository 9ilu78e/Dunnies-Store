import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const saleFilter = {
      flashSalePrice: { not: null },
      flashSaleEndsAt: { gt: now },
    };
    const [products, gifts, souvenirs] = await Promise.all([
      prisma.product.findMany({
        where: saleFilter,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          stockQuantity: true,
          imageUrl: true,
          imageUrls: true,
          flashSalePrice: true,
          flashSaleEndsAt: true,
        },
      }),
      prisma.gift.findMany({
        where: saleFilter,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          stockQuantity: true,
          imageUrl: true,
          imageUrls: true,
          flashSalePrice: true,
          flashSaleEndsAt: true,
        },
      }),
      prisma.souvenir.findMany({
        where: saleFilter,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          stockQuantity: true,
          imageUrl: true,
          imageUrls: true,
          flashSalePrice: true,
          flashSaleEndsAt: true,
        },
      }),
    ]);
    const allSales = [
      ...products.map((product) => ({
        ...product,
        href: `/product/${product.id}`,
      })),
      ...gifts.map((gift) => ({ ...gift, href: `/gift/${gift.id}` })),
      ...souvenirs.map((souvenir) => ({
        ...souvenir,
        href: `/souvenirs/${souvenir.id}`,
      })),
    ];
    const ratings = allSales.length
      ? await prisma.productComment.groupBy({
          by: ["productId"],
          where: { productId: { in: allSales.map((item) => item.id) } },
          _avg: { rating: true },
          _count: { _all: true },
        })
      : [];
    const ratingByProductId = new Map(
      ratings.map((rating) => [
        rating.productId,
        {
          average: rating._avg.rating || 0,
          count: rating._count._all,
        },
      ])
    );

    return NextResponse.json(
      {
        products: allSales
          .sort(
            (a, b) =>
              new Date(a.flashSaleEndsAt!).getTime() -
              new Date(b.flashSaleEndsAt!).getTime()
          )
          .map((product) => ({
          ...product,
          href: product.href,
          rating: ratingByProductId.get(product.id)?.average || 0,
          reviews: ratingByProductId.get(product.id)?.count || 0,
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[FLASH_SALES_GET]", error);
    return NextResponse.json(
      { error: "Unable to fetch flash sales" },
      { status: 500 }
    );
  }
}
