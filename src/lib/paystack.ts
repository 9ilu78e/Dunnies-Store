import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

type PaystackTransaction = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  id: number | string;
  gateway_response?: string;
};

type PaystackEnvelope = {
  status: boolean;
  message?: string;
  data?: PaystackTransaction;
};

export async function verifyPaystackTransaction(
  reference: string
): Promise<PaystackTransaction> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error("Paystack is not configured on the server.");

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${secretKey}` },
      cache: "no-store",
    }
  );
  const result = (await response.json()) as PaystackEnvelope;
  if (!response.ok || !result.status || !result.data) {
    throw new Error("Paystack could not verify this payment.");
  }
  return result.data;
}

export function isValidPaystackSignature(
  rawBody: string,
  signature: string | null
) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey || !signature || !/^[\da-f]{128}$/i.test(signature)) {
    return false;
  }
  const expected = createHmac("sha512", secretKey).update(rawBody).digest();
  const received = Buffer.from(signature, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function settlePaystackPayment(
  reference: string,
  transaction: PaystackTransaction
) {
  const payment = await prisma.paystackPayment.findUnique({
    where: { reference },
    include: { order: true },
  });
  if (!payment) throw new Error("Payment reference was not found.");
  if (transaction.reference !== payment.reference) {
    throw new Error("Payment reference did not match.");
  }
  if (
    !Number.isSafeInteger(transaction.amount) ||
    transaction.amount !== payment.amountKobo ||
    transaction.amount !== Math.round(payment.order.total * 100)
  ) {
    throw new Error("Payment amount did not match the order.");
  }
  if (
    transaction.currency !== payment.currency ||
    transaction.currency !== "NGN"
  ) {
    throw new Error("Payment currency did not match the order.");
  }

  if (transaction.status !== "success") {
    const failedStatus =
      transaction.status === "abandoned" ? "cancelled" : "failed";
    if (payment.status !== "paid") {
      await prisma.$transaction([
        prisma.paystackPayment.updateMany({
          where: { id: payment.id, status: { not: "paid" } },
          data: {
            status: failedStatus,
            transactionId: String(transaction.id),
            authorizationUrl: null,
          },
        }),
        prisma.order.updateMany({
          where: { id: payment.orderId, paymentStatus: { not: "paid" } },
          data: { paymentStatus: failedStatus },
        }),
      ]);
    }
    return { paymentStatus: payment.status === "paid" ? "paid" : failedStatus, order: payment.order };
  }

  if (payment.status === "paid" || payment.order.paymentStatus === "paid") {
    return { paymentStatus: "paid", order: payment.order };
  }

  const changed = await prisma.$transaction(async (transactionDb) => {
    const updated = await transactionDb.paystackPayment.updateMany({
      where: { id: payment.id, status: { not: "paid" } },
      data: {
        status: "paid",
        transactionId: String(transaction.id),
        paidAt: new Date(),
        authorizationUrl: null,
      },
    });
    if (updated.count === 0) return false;
    await transactionDb.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: "paid" },
    });
    return true;
  });

  if (changed) {
    const safeOrderNumber = payment.order.orderNumber;
    try {
      const escapeHtml = (value: string) =>
        value.replace(/[&<>"']/g, (char) =>
          ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!
        );
      await sendEmail({
        to: payment.order.customerEmail,
        subject: `Payment confirmed - Order #${safeOrderNumber}`,
        html: `<p>Hello ${escapeHtml(payment.order.customerName)},</p><p>Your payment for order #${safeOrderNumber} has been verified successfully.</p><p>Amount paid: ₦${(payment.amountKobo / 100).toLocaleString()}<br>Payment status: Paid<br>Order status: ${escapeHtml(payment.order.status)}</p><p>Your order will now continue through the normal fulfilment process. Payment confirmation does not mean that the order has been delivered.</p>`,
      });
    } catch (error) {
      console.error("[PAYSTACK_PAYMENT_EMAIL]", error);
    }
  }

  return { paymentStatus: "paid", order: payment.order };
}
