import { NextRequest, NextResponse } from "next/server";
import { verifyUserAuth } from "@/lib/authMiddleware";
import { prisma } from "@/lib/prisma";
import {
  settlePaystackPayment,
  verifyPaystackTransaction,
} from "@/lib/paystack";

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user?.email) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const body = (await request.json()) as { reference?: unknown };
    if (typeof body.reference !== "string" || !body.reference.trim()) {
      return NextResponse.json({ error: "A valid payment reference is required." }, { status: 400 });
    }

    const payment = await prisma.paystackPayment.findUnique({
      where: { reference: body.reference },
      include: { order: true },
    });
    if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    if (
      auth.user.role.toLowerCase() !== "admin" &&
      payment.order.customerEmail.trim().toLowerCase() !== auth.user.email.trim().toLowerCase()
    ) {
      return NextResponse.json({ error: "You cannot verify this payment." }, { status: 403 });
    }

    const transaction = await verifyPaystackTransaction(payment.reference);
    const result = await settlePaystackPayment(payment.reference, transaction);
    return NextResponse.json({
      paymentStatus: result.paymentStatus,
      orderStatus: result.order.status,
      orderNumber: result.order.orderNumber,
      amount: payment.amountKobo / 100,
    });
  } catch (error) {
    console.error("[PAYSTACK_VERIFY]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment verification failed." },
      { status: 400 }
    );
  }
}
