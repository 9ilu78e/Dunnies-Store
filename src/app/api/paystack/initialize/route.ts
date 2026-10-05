import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUserAuth } from "@/lib/authMiddleware";

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user?.email) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: "Online payment is not configured." }, { status: 503 });
    }
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      return NextResponse.json({ error: "Payment callback URL is not configured." }, { status: 503 });
    }

    const body = (await request.json()) as { orderId?: unknown };
    if (typeof body.orderId !== "string" || !body.orderId.trim()) {
      return NextResponse.json({ error: "A valid order ID is required." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: body.orderId },
      include: { payment: true },
    });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (
      auth.user.role.toLowerCase() !== "admin" &&
      order.customerEmail.trim().toLowerCase() !== auth.user.email.trim().toLowerCase()
    ) {
      return NextResponse.json({ error: "You cannot pay for this order." }, { status: 403 });
    }
    if (order.status === "cancelled" || order.archivedAt) {
      return NextResponse.json({ error: "This order is not eligible for payment." }, { status: 409 });
    }
    if (order.paymentStatus === "paid") {
      return NextResponse.json({ error: "This order has already been paid." }, { status: 409 });
    }
    if (!Number.isFinite(order.total) || order.total <= 0) {
      return NextResponse.json({ error: "The order total is not valid for payment." }, { status: 400 });
    }
    const amountKobo = Math.round(order.total * 100);
    if (!Number.isSafeInteger(amountKobo) || amountKobo <= 0) {
      return NextResponse.json({ error: "The order total is not valid for payment." }, { status: 400 });
    }

    const payment = await prisma.$transaction(async (db) => {
      await db.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${order.id}))`;
      const existing = await db.paystackPayment.findUnique({
        where: { orderId: order.id },
      });
      if (existing?.status === "paid") {
        throw new Error("ALREADY_PAID");
      }
      if (
        existing?.status === "pending" &&
        existing.amountKobo === amountKobo &&
        existing.authorizationUrl
      ) {
        return existing;
      }
      if (existing?.status === "pending" && !existing.authorizationUrl) {
        throw new Error("INITIALIZATION_IN_PROGRESS");
      }

      const reference = `DUN-${order.orderNumber}-${randomUUID()}`;
      if (existing) {
        return db.paystackPayment.update({
          where: { id: existing.id },
          data: {
            reference,
            amountKobo,
            currency: "NGN",
            status: "pending",
            transactionId: null,
            paidAt: null,
            authorizationUrl: null,
          },
        });
      }
      return db.paystackPayment.create({
        data: {
          orderId: order.id,
          reference,
          amountKobo,
          currency: "NGN",
          status: "pending",
        },
      });
    });

    if (payment.authorizationUrl) {
      return NextResponse.json({
        authorizationUrl: payment.authorizationUrl,
        reference: payment.reference,
      });
    }

    const callbackUrl = new URL("/payment/callback", process.env.NEXT_PUBLIC_APP_URL).toString();
    let paystackResponse: Response;
    let result: {
      status?: boolean;
      message?: string;
      data?: { authorization_url?: string };
    };
    try {
      paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: order.customerEmail,
          amount: payment.amountKobo,
          currency: payment.currency,
          reference: payment.reference,
          callback_url: callbackUrl,
          metadata: { orderId: order.id, orderNumber: order.orderNumber },
        }),
        cache: "no-store",
      });
      result = (await paystackResponse.json()) as {
        status?: boolean;
        message?: string;
        data?: { authorization_url?: string };
      };
    } catch (error) {
      await prisma.paystackPayment.updateMany({
        where: { id: payment.id, reference: payment.reference, status: "pending" },
        data: { status: "failed" },
      });
      await prisma.order.updateMany({
        where: { id: order.id, paymentStatus: { not: "paid" } },
        data: { paymentStatus: "failed" },
      });
      console.error("[PAYSTACK_INITIALIZE_NETWORK]", error);
      return NextResponse.json({ error: "Could not connect to Paystack. Please retry." }, { status: 502 });
    }
    if (
      !paystackResponse.ok ||
      !result.status ||
      typeof result.data?.authorization_url !== "string"
    ) {
      const providerMessage =
        typeof result.message === "string"
          ? result.message.replace(/\s+/g, " ").trim().slice(0, 240)
          : "";
      await prisma.paystackPayment.updateMany({
        where: { id: payment.id, reference: payment.reference, status: "pending" },
        data: { status: "failed" },
      });
      await prisma.order.updateMany({
        where: { id: order.id, paymentStatus: { not: "paid" } },
        data: { paymentStatus: "failed" },
      });
      console.error(
        "[PAYSTACK_INITIALIZE]",
        providerMessage || `Paystack initialization failed (HTTP ${paystackResponse.status}).`
      );
      return NextResponse.json(
        {
          error: providerMessage
            ? `Paystack rejected payment initialization: ${providerMessage}`
            : `Paystack could not initialize payment (HTTP ${paystackResponse.status}). Please retry.`,
        },
        { status: 502 }
      );
    }

    const updated = await prisma.paystackPayment.updateMany({
      where: { id: payment.id, reference: payment.reference, status: "pending" },
      data: { authorizationUrl: result.data.authorization_url },
    });
    if (updated.count === 0) {
      return NextResponse.json({ error: "Payment state changed; please retry." }, { status: 409 });
    }
    await prisma.order.updateMany({
      where: { id: order.id, paymentStatus: { not: "paid" } },
      data: { paymentMethod: "paystack", paymentStatus: "pending" },
    });
    return NextResponse.json({
      authorizationUrl: result.data.authorization_url,
      reference: payment.reference,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ALREADY_PAID") {
      return NextResponse.json({ error: "This order has already been paid." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "INITIALIZATION_IN_PROGRESS") {
      return NextResponse.json({ error: "Payment is already being initialized." }, { status: 409 });
    }
    console.error("[PAYSTACK_INITIALIZE]", error);
    return NextResponse.json({ error: "Could not start payment. Please retry." }, { status: 500 });
  }
}
