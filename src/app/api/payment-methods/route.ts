import { NextRequest, NextResponse } from "next/server";
import { verifyUserAuth } from "@/lib/authMiddleware";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user?.email) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: {
        email: { equals: auth.user.email.trim(), mode: "insensitive" },
      },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ paymentMethods: [] });

    const paymentMethods = await prisma.savedPaymentMethod.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        brand: true,
        cardType: true,
        last4: true,
        expMonth: true,
        expYear: true,
        bank: true,
        isDefault: true,
        createdAt: true,
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ paymentMethods });
  } catch (error) {
    console.error("[PAYMENT_METHODS_GET]", error);
    return NextResponse.json(
      { error: "Unable to load saved payment methods." },
      { status: 500 }
    );
  }
}
