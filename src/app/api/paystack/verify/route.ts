import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  settlePaystackPayment,
  verifyPaystackTransaction,
} from "@/lib/paystack";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { reference?: unknown };
    if (
      typeof body.reference !== "string" ||
      !body.reference.trim() ||
      body.reference.length > 200
    ) {
      return NextResponse.json({ error: "A valid payment reference is required." }, { status: 400 });
    }

    const payment = await prisma.paystackPayment.findUnique({
      where: { reference: body.reference.trim() },
      include: { order: true },
    });
    if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });

    // Paystack redirects can arrive without the store login session. The opaque
    // reference identifies only this payment; settlement still requires Paystack verification.
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
