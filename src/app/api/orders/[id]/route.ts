import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUserAuth } from "@/lib/authMiddleware";
import {
  sendEmail,
  type OrderEmailItem,
} from "@/lib/email";
import { generateOrderDeliveryEmail } from "@/lib/emails/orderDeliveryEmail";
import { formatOrderNumber } from "@/lib/orderNumber";
import { canAccessOrder } from "@/lib/orderOwnership";

const VALID_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "delivered",
  "cancelled",
] as const;

const ORDER_STATUS_COPY: Record<(typeof VALID_ORDER_STATUSES)[number], string> = {
  pending: "Your order is still pending review.",
  confirmed: "Your order has been confirmed and is being prepared.",
  processing: "Your order is now being processed.",
  delivered: "Your order has been delivered successfully.",
  cancelled: "Your order has been cancelled.",
};

function toStatusLabel(status: string) {
  return status
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function readEmailGiftContents(
  value: unknown
): Array<{ name: string; quantity: number; size?: string; price?: number }> {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (
      !item ||
      typeof item !== "object" ||
      Array.isArray(item) ||
      !("name" in item) ||
      typeof item.name !== "string" ||
      !("quantity" in item) ||
      typeof item.quantity !== "number"
    ) {
      return [];
    }

    return [
      {
        name: item.name,
        quantity: item.quantity,
        ...("size" in item && typeof item.size === "string"
          ? { size: item.size }
          : {}),
        ...("price" in item && typeof item.price === "number"
          ? { price: item.price }
          : {}),
      },
    ];
  });
}

async function getOrderAccountId(order: { userId: string | null; customerEmail: string }) {
  if (order.userId) {
    return order.userId;
  }

  const user = await prisma.user.findUnique({
    where: { email: order.customerEmail },
    select: { id: true },
  });

  return user?.id ?? null;
}

async function createStatusNotification(
  orderId: string,
  orderNumber: number,
  accountId: string | null,
  title: string,
  message: string
) {
  if (!accountId) return;

  await prisma.notification.create({
    data: {
      recipientRole: "user",
      accountId,
      orderId,
      title,
      message,
      link: `/orders?orderNumber=${formatOrderNumber(orderNumber)}#order-${formatOrderNumber(orderNumber)}`,
    },
  });
}

async function createAdminStatusNotification(
  orderId: string,
  orderNumber: number,
  status: string
) {
  const adminUsers = await Promise.all([
    prisma.user.findMany({
      where: { role: { equals: "admin", mode: "insensitive" } },
      select: { id: true },
    }),
    prisma.firebaseUser.findMany({
      where: { role: { equals: "admin", mode: "insensitive" } },
      select: { uid: true },
    }),
  ]);

  const adminAccountIds = Array.from(
    new Set([
      ...adminUsers[0].map((admin) => admin.id),
      ...adminUsers[1].map((admin) => admin.uid),
    ])
  );

  if (adminAccountIds.length === 0) return;

  await prisma.notification.createMany({
    data: adminAccountIds.map((accountId) => ({
      recipientRole: "admin",
      accountId,
      orderId,
      title: `Order ${status}`,
      message: `Order #${formatOrderNumber(orderNumber)} status was updated to ${toStatusLabel(status)}.`,
      link: "/manage-orders",
    })),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (auth.user.role.toLowerCase() !== "admin") {
      return NextResponse.json({ error: "Only admin users can update order status." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                price: true,
                imageUrl: true,
                imageUrls: true,
                category: { select: { name: true } },
              },
            },
            gift: {
              select: {
                name: true,
                price: true,
                extraPrice: true,
                imageUrl: true,
                imageUrls: true,
                category: { select: { name: true } },
              },
            },
            souvenir: {
              select: {
                name: true,
                price: true,
                imageUrl: true,
                imageUrls: true,
                category: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (Object.prototype.hasOwnProperty.call(body, "archived")) {
      if (typeof body.archived !== "boolean") {
        return NextResponse.json(
          { error: "Archived must be a boolean." },
          { status: 400 }
        );
      }

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: { archivedAt: body.archived ? new Date() : null },
      });

      return NextResponse.json({
        message: body.archived
          ? "Order moved to order history."
          : "Order restored from order history.",
        order: updatedOrder,
      });
    }

    if (Object.prototype.hasOwnProperty.call(body, "paymentStatus")) {
      return NextResponse.json(
        { error: "Payment status can only be updated through verified payment processing." },
        { status: 403 }
      );
    }

    if (order.archivedAt) {
      return NextResponse.json(
        { error: "Archived orders must be restored before changing their status." },
        { status: 409 }
      );
    }

    const requestedStatus = String(body.status || "").trim().toLowerCase();
    if (!VALID_ORDER_STATUSES.includes(requestedStatus as (typeof VALID_ORDER_STATUSES)[number])) {
      return NextResponse.json(
        { error: "Invalid order status." },
        { status: 400 }
      );
    }
    if (
      order.paymentMethod === "paystack" &&
      order.paymentStatus !== "paid" &&
      ["processing", "delivered"].includes(requestedStatus)
    ) {
      return NextResponse.json(
        { error: "Payment must be verified before the order can be processed for delivery." },
        { status: 409 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: requestedStatus,
        notes:
          typeof body.notes === "string" && body.notes.trim()
            ? `${order.notes || ""}\n${body.notes}`.trim()
            : order.notes,
      },
      include: { orderItems: true },
    });

    const userAccountId = await getOrderAccountId(order);
    const statusLabel = toStatusLabel(requestedStatus);
    const nextMessage = ORDER_STATUS_COPY[requestedStatus as (typeof VALID_ORDER_STATUSES)[number]];

    const customerAccount = userAccountId
      ? await prisma.user.findUnique({
          where: { id: userAccountId },
          select: { notificationPreferences: true },
        })
      : null;
    const savedPreferences = customerAccount?.notificationPreferences;
    const orderUpdatesEnabled =
      !savedPreferences ||
      typeof savedPreferences !== "object" ||
      Array.isArray(savedPreferences) ||
      !("orderUpdates" in savedPreferences) ||
      savedPreferences.orderUpdates !== false;
    const statusChanged = order.status !== requestedStatus;

    if (statusChanged && userAccountId && orderUpdatesEnabled) {
      const statusTitle = `Order ${statusLabel}`;
      await createStatusNotification(
        order.id,
        order.orderNumber,
        userAccountId,
        statusTitle,
        `${nextMessage} Order #${formatOrderNumber(order.orderNumber)} is now ${statusLabel.toLowerCase()}.`
      );
    }

    if (statusChanged) {
      await createAdminStatusNotification(
        order.id,
        order.orderNumber,
        requestedStatus
      );
    }

    if (
      statusChanged &&
      orderUpdatesEnabled &&
      (requestedStatus === "confirmed" || requestedStatus === "delivered")
    ) {
      try {
        const emailItems: OrderEmailItem[] = order.orderItems.map((item) => {
          const giftContents = readEmailGiftContents(item.giftContents);
          const contentsTotal = giftContents.reduce(
            (sum, content) => sum + (content.price ?? 0) * content.quantity,
            0
          );
          const unitPrice =
            item.unitPrice ??
            (item.gift
              ? item.gift.extraPrice + contentsTotal
              : item.product?.price ?? item.souvenir?.price ?? 0);
          const itemName =
            item.product?.name ?? item.gift?.name ?? item.souvenir?.name ?? "Item";
          const catalogItem = item.product ?? item.gift ?? item.souvenir;

          return {
            name: `${itemName}${item.size ? ` (Size ${item.size})` : ""}`,
            quantity: item.quantity,
            price: unitPrice,
            imageUrl: catalogItem
              ? catalogItem.imageUrls[0] || catalogItem.imageUrl || undefined
              : undefined,
            categoryName: catalogItem?.category?.name || "Store item",
            ...(giftContents.length ? { giftContents } : {}),
          };
        });
        const itemsTotal = emailItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        const inferredDeliveryFee = order.total - itemsTotal;
        const deliveryFee =
          order.deliveryFee ??
          (inferredDeliveryFee > 0 ? inferredDeliveryFee : null);
        const orderEmailDetails = {
          orderNumber: formatOrderNumber(order.orderNumber),
          status: statusLabel,
          items: emailItems,
          total: order.total,
          deliveryFee,
          deliveryAddress: order.deliveryAddress,
          paymentMethod: order.paymentMethod,
          orderDate: order.createdAt,
        };
        const statusMessage = `${ORDER_STATUS_COPY[requestedStatus as (typeof VALID_ORDER_STATUSES)[number]]}\n\nYou can track your order in your customer account any time.`;
        const userEmailHtml = generateOrderDeliveryEmail(
          order.customerName,
          statusLabel,
          statusMessage,
          orderEmailDetails
        );

        await sendEmail({
          to: order.customerEmail,
          subject: `Order ${statusLabel} - #${formatOrderNumber(order.orderNumber)}`,
          html: userEmailHtml,
        });
      } catch (emailError) {
        console.error("Failed to send order status email:", emailError);
      }
    }

    return NextResponse.json({
      message: "Order status updated successfully.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("[ORDER_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update order status." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, userId: true, archivedAt: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (!(await canAccessOrder(auth.user, order))) {
      return NextResponse.json(
        { error: "You do not have permission to delete this order." },
        { status: 403 }
      );
    }

    if (order.archivedAt) {
      return NextResponse.json(
        { error: "This order is already in order history." },
        { status: 409 }
      );
    }

    const archivedOrder = await prisma.order.update({
      where: { id },
      data: { archivedAt: new Date() },
    });

    return NextResponse.json({
      message: "Order moved to order history.",
      order: archivedOrder,
    });
  } catch (error) {
    console.error("[ORDER_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to move order to history." },
      { status: 500 }
    );
  }
}
