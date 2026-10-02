import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail, generateOrderConfirmationEmail, generateAdminOrderNotificationEmail } from "@/lib/email";

interface OrderItemInput {
  productId?: string;
  itemId?: string;
  itemType?: "product" | "gift" | "souvenir";
  name?: string;
  quantity: number;
  price?: number;
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

    const { customerName, customerEmail, customerPhone, items, total, source, notes } = body;

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
    const [products, gifts, souvenirs] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, price: true },
      }),
      prisma.gift.findMany({
        where: { id: { in: giftIds } },
        select: { id: true, name: true, price: true },
      }),
      prisma.souvenir.findMany({
        where: { id: { in: souvenirIds } },
        select: { id: true, name: true, price: true },
      }),
    ]);
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
    const itemsWithDetails = normalizedItems.map((item) => {
      const catalogItem = catalogItems[item.itemType].get(item.itemId!)!;
      return {
        ...item,
        name: item.name || catalogItem.name,
        price: item.price ?? catalogItem.price,
      };
    });

    const order = await prisma.order.create({
      data: {
        customerName,
        customerEmail,
        customerPhone,
        total,
        source,
        notes,
        orderItems: {
          create: itemsWithDetails.map((item) => ({
            productId: item.itemType === "product" ? item.itemId : null,
            giftId: item.itemType === "gift" ? item.itemId : null,
            souvenirId: item.itemType === "souvenir" ? item.itemId : null,
            quantity: item.quantity,
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
        total,
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
          total,
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
        orderItems: true,
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
