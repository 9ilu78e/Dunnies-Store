import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  sendEmail,
  generateOrderConfirmationEmail,
  generateAdminOrderNotificationEmail,
} from "@/lib/email";
import {
  formatVariantChoice,
  getVariantChoiceKind,
  getVariantKindLabel,
  readSizeVariants,
} from "@/lib/sizeVariants";
import {
  readGiftIncludedProducts,
  type GiftContentSelection,
  type GiftContentSnapshot,
} from "@/lib/giftContents";

interface OrderItemInput {
  productId?: string;
  itemId?: string;
  itemType?: "product" | "gift" | "souvenir";
  name?: string;
  quantity: number;
  price?: number;
  size?: string;
  giftContents?: GiftContentSelection[];
}

type CatalogItemType = "product" | "gift" | "souvenir";

interface CreateOrderRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItemInput[];
  total: number;
  source: "site" | "whatsapp" | "other";
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();

    const { customerName, customerEmail, customerPhone, items, source, notes } =
      body;

    if (
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const normalizedItems = items.map((item) => ({
      ...item,
      itemType: item.itemType ?? "product",
      itemId: item.itemId ?? item.productId,
    }));
    const validItemTypes: CatalogItemType[] = ["product", "gift", "souvenir"];
    if (
      normalizedItems.some(
        (item) =>
          !item.itemId ||
          !validItemTypes.includes(item.itemType) ||
          !Number.isSafeInteger(item.quantity) ||
          item.quantity < 1 ||
          (item.name !== undefined && typeof item.name !== "string") ||
          (item.size !== undefined &&
            (typeof item.size !== "string" || !item.size.trim())) ||
          (item.giftContents !== undefined &&
            (!Array.isArray(item.giftContents) ||
              item.giftContents.length === 0 ||
              item.giftContents.length > 30 ||
              item.giftContents.some(
                (content) =>
                  !content ||
                  typeof content.productId !== "string" ||
                  !content.productId.trim() ||
                  !Number.isSafeInteger(content.quantity) ||
                  content.quantity < 1 ||
                  (content.size !== undefined &&
                    (typeof content.size !== "string" || !content.size.trim()))
              ))) ||
          (item.price !== undefined &&
            (!Number.isFinite(item.price) || item.price < 0))
      )
    ) {
      return NextResponse.json(
        { error: "Each order item must reference a valid catalog item." },
        { status: 400 }
      );
    }

    const productIds = normalizedItems
      .filter((item) => item.itemType === "product")
      .map((item) => item.itemId!);
    const giftIds = normalizedItems
      .filter((item) => item.itemType === "gift")
      .map((item) => item.itemId!);
    const souvenirIds = normalizedItems
      .filter((item) => item.itemType === "souvenir")
      .map((item) => item.itemId!);
    const [gifts, souvenirs] = await Promise.all([
      prisma.gift.findMany({
        where: { id: { in: giftIds } },
        select: {
          id: true,
          name: true,
          price: true,
          stockQuantity: true,
          sizeVariants: true,
          includedProducts: true,
          extraPrice: true,
          flashSalePrice: true,
          flashSaleEndsAt: true,
        },
      }),
      prisma.souvenir.findMany({
        where: { id: { in: souvenirIds } },
        select: {
          id: true,
          name: true,
          price: true,
          stockQuantity: true,
          sizeVariants: true,
          flashSalePrice: true,
          flashSaleEndsAt: true,
        },
      }),
    ]);
    const configuredGiftProductIds = gifts.flatMap((gift) =>
      readGiftIncludedProducts(gift.includedProducts).map(
        (content) => content.productId
      )
    );
    const selectedGiftProductIds = normalizedItems.flatMap(
      (item) => item.giftContents?.map((content) => content.productId) ?? []
    );
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: [
            ...new Set([
              ...productIds,
              ...configuredGiftProductIds,
              ...selectedGiftProductIds,
            ]),
          ],
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
        stockQuantity: true,
        sizeVariants: true,
        imageUrl: true,
        imageUrls: true,
        flashSalePrice: true,
        flashSaleEndsAt: true,
      },
    });
    const catalogItems = {
      product: new Map(products.map((item) => [item.id, item])),
      gift: new Map(gifts.map((item) => [item.id, item])),
      souvenir: new Map(souvenirs.map((item) => [item.id, item])),
    };
    if (
      normalizedItems.some(
        (item) => !catalogItems[item.itemType].has(item.itemId!)
      )
    ) {
      return NextResponse.json(
        { error: "An order item was not found in the selected catalog." },
        { status: 400 }
      );
    }
    const requiredStock = new Map<
      string,
      { name: string; stockQuantity: number; quantity: number }
    >();
    const addStockRequirement = (
      key: string,
      name: string,
      stockQuantity: number,
      quantity: number
    ) => {
      const current = requiredStock.get(key);
      requiredStock.set(key, {
        name,
        stockQuantity,
        quantity: (current?.quantity ?? 0) + quantity,
      });
    };
    const getCatalogPrice = (catalogItem: {
      price: number;
      flashSalePrice: number | null;
      flashSaleEndsAt: Date | null;
    }) =>
      catalogItem.flashSalePrice !== null &&
      catalogItem.flashSaleEndsAt !== null &&
      catalogItem.flashSaleEndsAt.getTime() > Date.now()
        ? catalogItem.flashSalePrice
        : catalogItem.price;

    const itemsWithDetails = [];
    for (const item of normalizedItems) {
      const catalogItem = catalogItems[item.itemType].get(item.itemId!)!;
      const variants = readSizeVariants(catalogItem.sizeVariants);
      const selectedVariant = variants.find(
        (variant) =>
          variant.size.toUpperCase() === item.size?.trim().toUpperCase()
      );
      if (variants.length > 0 && !selectedVariant) {
        return NextResponse.json(
          { error: `Choose a valid size for ${catalogItem.name}.` },
          { status: 400 }
        );
      }
      if (variants.length === 0 && item.size) {
        return NextResponse.json(
          { error: `${catalogItem.name} does not have size choices.` },
          { status: 400 }
        );
      }
      if (selectedVariant) item.size = selectedVariant.size;
      const itemStock =
        selectedVariant?.stockQuantity ?? catalogItem.stockQuantity;
      addStockRequirement(
        `${item.itemType}:${item.itemId}:${item.size ?? ""}`,
        catalogItem.name,
        itemStock,
        item.quantity
      );

      let giftContents: GiftContentSnapshot[] | undefined;
      let unitPrice = getCatalogPrice(catalogItem);
      if (item.itemType === "gift") {
        const gift = catalogItems.gift.get(item.itemId!)!;
        const requestedContents: GiftContentSelection[] =
          item.giftContents ??
          readGiftIncludedProducts(gift.includedProducts).map((content) => ({
            ...content,
          }));
        if (requestedContents.length > 0) {
          giftContents = [];
          unitPrice = gift.extraPrice;
          for (const content of requestedContents) {
            const bundledProduct = catalogItems.product.get(content.productId);
            if (!bundledProduct) {
              return NextResponse.json(
                { error: "A selected gift product is no longer available." },
                { status: 400 }
              );
            }
            const bundledVariants = readSizeVariants(
              bundledProduct.sizeVariants
            );
            const bundledVariant = bundledVariants.find(
              (variant) =>
                variant.size.toUpperCase() ===
                content.size?.trim().toUpperCase()
            );
            if (bundledVariants.length > 0 && !bundledVariant) {
              return NextResponse.json(
                { error: `Choose a valid size for ${bundledProduct.name}.` },
                { status: 400 }
              );
            }
            if (bundledVariants.length === 0 && content.size) {
              return NextResponse.json(
                { error: `${bundledProduct.name} does not have size choices.` },
                { status: 400 }
              );
            }
            const bundledStock =
              bundledVariant?.stockQuantity ?? bundledProduct.stockQuantity;
            const bundledSize = bundledVariant?.size;
            addStockRequirement(
              `product:${bundledProduct.id}:${bundledSize ?? ""}`,
              bundledProduct.name,
              bundledStock,
              content.quantity * item.quantity
            );
            const productPrice = getCatalogPrice(bundledProduct);
            unitPrice += productPrice * content.quantity;
            giftContents.push({
              productId: bundledProduct.id,
              name: bundledProduct.name,
              quantity: content.quantity,
              ...(bundledSize ? { size: bundledSize } : {}),
              price: productPrice,
              image:
                bundledProduct.imageUrls[0] || bundledProduct.imageUrl || "",
            });
          }
          item.giftContents = requestedContents;
        }
      }

      itemsWithDetails.push({
        ...item,
        name: `${item.name || catalogItem.name}${
          item.size
            ? ` (${getVariantKindLabel(
                getVariantChoiceKind(item.size)
              )} ${formatVariantChoice(item.size)})`
            : ""
        }`,
        price: unitPrice,
        giftContents,
      });
    }

    for (const requirement of requiredStock.values()) {
      if (requirement.quantity > requirement.stockQuantity) {
        return NextResponse.json(
          {
            error: `Not enough stock for ${requirement.name}; only ${requirement.stockQuantity} available.`,
          },
          { status: 400 }
        );
      }
    }

    const deliveryFee = 2500;
    const verifiedTotal =
      itemsWithDetails.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ) + deliveryFee;

    const order = await prisma.order.create({
      data: {
        customerName,
        customerEmail,
        customerPhone,
        total: verifiedTotal,
        source,
        notes,
        orderItems: {
          create: itemsWithDetails.map((item) => ({
            productId: item.itemType === "product" ? item.itemId : null,
            giftId: item.itemType === "gift" ? item.itemId : null,
            souvenirId: item.itemType === "souvenir" ? item.itemId : null,
            quantity: item.quantity,
            size: item.size ?? null,
            ...(item.giftContents
              ? {
                  giftContents: item.giftContents as Prisma.InputJsonValue,
                }
              : {}),
          })),
        },
      },
      include: {
        orderItems: true,
      },
    });

    try {
      const emailContent = generateOrderConfirmationEmail(
        customerName,
        itemsWithDetails,
        verifiedTotal,
        source
      );

      await sendEmail({
        to: customerEmail,
        subject: `Order Confirmation - Order #${order.id}`,
        html: emailContent,
      });
    } catch (emailError) {
      console.error("Failed to send customer confirmation email:", emailError);
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.FORMSPREE_EMAIL;
    if (adminEmail) {
      try {
        const adminEmailContent = generateAdminOrderNotificationEmail(
          customerName,
          customerEmail,
          customerPhone,
          itemsWithDetails,
          verifiedTotal,
          source,
          order.id
        );

        await sendEmail({
          to: adminEmail,
          subject: `[NEW ORDER] #${order.id} - ${customerName}`,
          html: adminEmailContent,
        });
      } catch (emailError) {
        console.error("Failed to send admin notification:", emailError);
      }
    }

    return NextResponse.json(
      { order, message: "Order created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("[ORDERS_POST]", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source");
    const status = searchParams.get("status");

    const where: any = {};

    if (source) {
      where.source = source;
    }

    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            product: { select: { name: true } },
            gift: { select: { name: true } },
            souvenir: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("[ORDERS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
