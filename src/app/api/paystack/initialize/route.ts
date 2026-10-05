import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUserAuth } from "@/lib/authMiddleware";
import { canAccessOrder } from "@/lib/orderOwnership";
import { decryptPaystackAuthorizationCode } from "@/lib/paystackAuthorization";
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
    if (!process.env.PAYSTACK_SECRET_KEY?.startsWith("sk_test_")) {
      return NextResponse.json(
        {
          error:
            "Paystack test payments need a secret key beginning with sk_test_ in PAYSTACK_SECRET_KEY.",
        },
        { status: 503 }
      );
    }
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      return NextResponse.json({ error: "Payment callback URL is not configured." }, { status: 503 });
    }

    const body = (await request.json()) as {
      orderId?: unknown;
      savedPaymentMethodId?: unknown;
      savePaymentMethod?: unknown;
    };
    if (typeof body.orderId !== "string" || !body.orderId.trim()) {
      return NextResponse.json({ error: "A valid order ID is required." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: body.orderId },
      include: { payment: true },
    });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (!(await canAccessOrder(auth.user, order))) {
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
    const savePaymentMethod = body.savePaymentMethod === true;
    if (savePaymentMethod && !process.env.NEXTAUTH_SECRET) {
      return NextResponse.json(
        { error: "Saved payment methods are not configured on this server." },
        { status: 503 }
      );
    }
    const savedPaymentMethodId =
      typeof body.savedPaymentMethodId === "string"
        ? body.savedPaymentMethodId.trim()
        : "";
    let savedAuthorizationCode = "";
    if (savedPaymentMethodId) {
      const account = await prisma.user.findFirst({
        where: {
          email: { equals: auth.user.email.trim(), mode: "insensitive" },
        },
        select: { id: true },
      });
      if (!account || account.id !== order.userId) {
        return NextResponse.json({ error: "That saved card does not belong to your account." }, { status: 403 });
      }
      const savedMethod = await prisma.savedPaymentMethod.findFirst({
        where: { id: savedPaymentMethodId, userId: account.id },
      });
      if (!savedMethod) {
        return NextResponse.json({ error: "Saved payment method not found." }, { status: 404 });
      }
      savedAuthorizationCode = decryptPaystackAuthorizationCode(
        savedMethod.authorizationCodeEncrypted
      );
    }

    let verifyExistingSavedCharge = false;
    const payment = await prisma.$transaction(async (db) => {
      const lockedOrders = await db.$queryRaw<{ id: string }[]>`
        SELECT "id"
        FROM "Order"
        WHERE "id" = ${order.id}
        FOR UPDATE
      `;
      if (lockedOrders.length === 0) {
        throw new Error("ORDER_NOT_FOUND");
      }

      const existing = await db.paystackPayment.findUnique({
        where: { orderId: order.id },
      });
      if (existing?.status === "paid") {
        throw new Error("ALREADY_PAID");
      }
      if (
        !savedPaymentMethodId &&
        existing?.status === "pending" &&
        existing.amountKobo === amountKobo &&
        existing.authorizationUrl
      ) {
        return db.paystackPayment.update({
          where: { id: existing.id },
          data: { savePaymentMethod: savePaymentMethod || existing.savePaymentMethod },
        });
      }
      if (existing?.status === "pending" && !existing.authorizationUrl) {
        if (existing.savedMethodChargeAttemptedAt) {
          verifyExistingSavedCharge = true;
          return existing;
        }
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
            savePaymentMethod,
            savedMethodChargeAttemptedAt: savedPaymentMethodId
              ? new Date()
              : null,
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
          savePaymentMethod,
          savedMethodChargeAttemptedAt: savedPaymentMethodId ? new Date() : null,
        },
      });
    });

    if (verifyExistingSavedCharge) {
      try {
        const transaction = await verifyPaystackTransaction(payment.reference);
        const settled = await settlePaystackPayment(payment.reference, transaction);
        if (
          settled.paymentStatus === "failed" ||
          settled.paymentStatus === "cancelled"
        ) {
          return NextResponse.json(
            {
              error: "The saved-card payment did not complete. Retry payment to start a new attempt.",
              paymentStatus: settled.paymentStatus,
            },
            { status: 409 }
          );
        }
        return NextResponse.json({
          paymentStatus: settled.paymentStatus,
          orderNumber: order.orderNumber,
        });
      } catch (error) {
        console.error("[PAYSTACK_SAVED_METHOD_RECONCILE]", error);
        return NextResponse.json({
          paymentStatus: "pending",
          orderNumber: order.orderNumber,
        });
      }
    }

    await prisma.order.updateMany({
      where: { id: order.id, paymentStatus: { not: "paid" } },
      data: { paymentMethod: "paystack", paymentStatus: "pending" },
    });

    if (payment.authorizationUrl) {
      return NextResponse.json({
        authorizationUrl: payment.authorizationUrl,
        reference: payment.reference,
      });
    }

    if (savedPaymentMethodId) {
      let chargeResponse: Response;
      let chargeResult: {
        status?: boolean;
        message?: string;
        data?: { status?: string };
      };
      try {
        chargeResponse = await fetch(
          "https://api.paystack.co/transaction/charge_authorization",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: order.customerEmail,
              amount: payment.amountKobo,
              authorization_code: savedAuthorizationCode,
              reference: payment.reference,
              currency: payment.currency,
              metadata: { orderId: order.id, orderNumber: order.orderNumber },
            }),
            cache: "no-store",
          }
        );
        chargeResult = (await chargeResponse.json()) as {
          status?: boolean;
          message?: string;
          data?: { status?: string };
        };
      } catch (error) {
        console.error("[PAYSTACK_SAVED_METHOD_CHARGE_NETWORK]", error);
        return NextResponse.json(
          {
            paymentStatus: "pending",
            orderNumber: order.orderNumber,
            message: "The payment is being checked. Please review the order status before retrying.",
          },
          { status: 202 }
        );
      }

      if (!chargeResponse.ok || !chargeResult.status) {
        const providerMessage =
          typeof chargeResult.message === "string"
            ? chargeResult.message.replace(/\s+/g, " ").trim().slice(0, 200)
            : "";
        await prisma.paystackPayment.updateMany({
          where: { id: payment.id, reference: payment.reference, status: "pending" },
          data: { status: "failed" },
        });
        await prisma.order.updateMany({
          where: { id: order.id, paymentStatus: { not: "paid" } },
          data: { paymentStatus: "failed" },
        });
        return NextResponse.json(
          {
            error: providerMessage
              ? `The saved card could not be charged: ${providerMessage}. Retry with Paystack checkout.`
              : "The saved card could not be charged. Retry with Paystack checkout.",
          },
          { status: 502 }
        );
      }

      if (chargeResult.data?.status !== "success") {
        try {
          const transaction = await verifyPaystackTransaction(payment.reference);
          const settled = await settlePaystackPayment(payment.reference, transaction);
          if (settled.paymentStatus === "failed" || settled.paymentStatus === "cancelled") {
            return NextResponse.json(
              {
                error: "The saved card was declined. Retry with Paystack checkout.",
                paymentStatus: settled.paymentStatus,
              },
              { status: 402 }
            );
          }
        } catch (error) {
          console.error("[PAYSTACK_SAVED_METHOD_VERIFY]", error);
        }
        return NextResponse.json(
          {
            paymentStatus: "pending",
            orderNumber: order.orderNumber,
            message:
              "The payment needs additional verification. Check your order status before retrying.",
          },
          { status: 202 }
        );
      }

      const transaction = await verifyPaystackTransaction(payment.reference);
      const settled = await settlePaystackPayment(payment.reference, transaction);
      if (
        settled.paymentStatus === "failed" ||
        settled.paymentStatus === "cancelled"
      ) {
        return NextResponse.json(
          {
            error: "The saved card was declined. Retry with Paystack checkout.",
            paymentStatus: settled.paymentStatus,
          },
          { status: 402 }
        );
      }
      return NextResponse.json({
        paymentStatus: settled.paymentStatus,
        orderNumber: order.orderNumber,
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
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            savePaymentMethod,
          },
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
    if (error instanceof Error && error.message === "ORDER_NOT_FOUND") {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    console.error("[PAYSTACK_INITIALIZE]", error);
    return NextResponse.json({ error: "Could not start payment. Please retry." }, { status: 500 });
  }
}
