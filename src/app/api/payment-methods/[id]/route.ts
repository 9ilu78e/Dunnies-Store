import { NextRequest, NextResponse } from "next/server";
import { verifyUserAuth } from "@/lib/authMiddleware";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

async function getPaymentMethodOwner(email: string) {
  return prisma.user.findFirst({
    where: { email: { equals: email.trim(), mode: "insensitive" } },
    select: { id: true },
  });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user?.email) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const body = (await request.json()) as { action?: unknown };
    if (body.action !== "default") {
      return NextResponse.json({ error: "Unsupported payment-method action." }, { status: 400 });
    }
    const user = await getPaymentMethodOwner(auth.user.email);
    if (!user) return NextResponse.json({ error: "Payment method not found." }, { status: 404 });
    const { id } = await params;
    const method = await prisma.savedPaymentMethod.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!method) return NextResponse.json({ error: "Payment method not found." }, { status: 404 });

    await prisma.$transaction([
      prisma.savedPaymentMethod.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      }),
      prisma.savedPaymentMethod.update({
        where: { id: method.id },
        data: { isDefault: true },
      }),
    ]);
    return NextResponse.json({ message: "Default payment method updated." });
  } catch (error) {
    console.error("[PAYMENT_METHODS_PATCH]", error);
    return NextResponse.json(
      { error: "Unable to update this payment method." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await verifyUserAuth(_request);
    if (!auth.isAuthenticated || !auth.user?.email) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const user = await getPaymentMethodOwner(auth.user.email);
    if (!user) return NextResponse.json({ error: "Payment method not found." }, { status: 404 });
    const { id } = await params;
    const method = await prisma.savedPaymentMethod.findFirst({
      where: { id, userId: user.id },
      select: { id: true, isDefault: true },
    });
    if (!method) return NextResponse.json({ error: "Payment method not found." }, { status: 404 });

    await prisma.$transaction(async (transaction) => {
      await transaction.savedPaymentMethod.delete({ where: { id: method.id } });
      if (method.isDefault) {
        const nextMethod = await transaction.savedPaymentMethod.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        });
        if (nextMethod) {
          await transaction.savedPaymentMethod.update({
            where: { id: nextMethod.id },
            data: { isDefault: true },
          });
        }
      }
    });
    return NextResponse.json({ message: "Payment method removed." });
  } catch (error) {
    console.error("[PAYMENT_METHODS_DELETE]", error);
    return NextResponse.json(
      { error: "Unable to remove this payment method." },
      { status: 500 }
    );
  }
}
