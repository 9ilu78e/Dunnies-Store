import { prisma } from "@/lib/prisma";

export interface BestSeller {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  stockQuantity: number;
  tag: string;
  href: string;
  orderCount: number;
  createdAt: Date;
}

export async function getBestSellers(limit = 18): Promise<BestSeller[]> {
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 30);
  const [orderItems, products, gifts, souvenirs] = await Promise.all([
    prisma.orderItem.findMany({
      where: {
        order: {
          status: { notIn: ["cancelled", "canceled", "refunded"] },
        },
      },
      select: {
        orderId: true,
        productId: true,
        giftId: true,
        souvenirId: true,
      },
    }),
    prisma.product.findMany({
      include: { category: true, comments: { select: { rating: true } } },
    }),
    prisma.gift.findMany(),
    prisma.souvenir.findMany(),
  ]);

  const ordersByItem = new Map<string, Set<string>>();
  for (const item of orderItems) {
    const catalogItems = [
      ["product", item.productId],
      ["gift", item.giftId],
      ["souvenir", item.souvenirId],
    ] as const;

    for (const [type, id] of catalogItems) {
      if (!id) continue;
      const key = `${type}:${id}`;
      const orderIds = ordersByItem.get(key) ?? new Set<string>();
      orderIds.add(item.orderId);
      ordersByItem.set(key, orderIds);
    }
  }

  const now = Date.now();
  const bestSellers: BestSeller[] = [
    ...products.map((product) => {
      const isFlashSaleActive =
        product.flashSalePrice !== null &&
        product.flashSaleEndsAt !== null &&
        product.flashSaleEndsAt.getTime() > now;
      const ratingTotal = product.comments.reduce(
        (total, comment) => total + comment.rating,
        0
      );

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: isFlashSaleActive
          ? product.flashSalePrice ?? product.price
          : product.price,
        originalPrice: isFlashSaleActive ? product.price : undefined,
        image: product.imageUrl || product.imageUrls[0] || "",
        rating:
          product.comments.length > 0
            ? Math.round((ratingTotal / product.comments.length) * 10) / 10
            : 0,
        reviews: product.comments.length,
        stockQuantity: product.stockQuantity,
        tag: product.category?.name || "Product",
        href: `/product/${product.id}`,
        orderCount: ordersByItem.get(`product:${product.id}`)?.size ?? 0,
        createdAt: product.createdAt,
      };
    }),
    ...gifts.map((gift) => {
      const isFlashSaleActive =
        gift.flashSalePrice !== null &&
        gift.flashSaleEndsAt !== null &&
        gift.flashSaleEndsAt.getTime() > now;

      return {
        id: gift.id,
        name: gift.name,
        description: gift.description || "",
        price: isFlashSaleActive
          ? gift.flashSalePrice ?? gift.price
          : gift.price,
        originalPrice: isFlashSaleActive ? gift.price : undefined,
        image: gift.imageUrl || gift.imageUrls[0] || "",
        rating: 0,
        reviews: 0,
        stockQuantity: gift.stockQuantity,
        tag: "Gift",
        href: `/gift/${gift.id}`,
        orderCount: ordersByItem.get(`gift:${gift.id}`)?.size ?? 0,
        createdAt: gift.createdAt,
      };
    }),
    ...souvenirs.map((souvenir) => {
      const isFlashSaleActive =
        souvenir.flashSalePrice !== null &&
        souvenir.flashSaleEndsAt !== null &&
        souvenir.flashSaleEndsAt.getTime() > now;

      return {
        id: souvenir.id,
        name: souvenir.name,
        description: souvenir.description || "",
        price: isFlashSaleActive
          ? souvenir.flashSalePrice ?? souvenir.price
          : souvenir.price,
        originalPrice: isFlashSaleActive ? souvenir.price : undefined,
        image: souvenir.imageUrl || souvenir.imageUrls[0] || "",
        rating: 0,
        reviews: 0,
        stockQuantity: souvenir.stockQuantity,
        tag: "Souvenir",
        href: `/souvenirs/${souvenir.id}`,
        orderCount: ordersByItem.get(`souvenir:${souvenir.id}`)?.size ?? 0,
        createdAt: souvenir.createdAt,
      };
    }),
  ];

  return bestSellers
    .sort(
      (left, right) =>
        right.orderCount - left.orderCount ||
        right.createdAt.getTime() - left.createdAt.getTime()
    )
    .slice(0, safeLimit);
}
