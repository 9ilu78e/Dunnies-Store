import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { createPaymentConfirmationEmail } from "@/lib/emails/paymentConfirmationEmail";
import { encryptPaystackAuthorizationCode } from "@/lib/paystackAuthorization";

type PaystackTransaction = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  id: number | string;
  gateway_response?: string;
  authorization?: {
    authorization_code?: string;
    signature?: string;
    reusable?: boolean;
    brand?: string;
    card_type?: string;
    last4?: string;
    exp_month?: string;
    exp_year?: string;
    bank?: string;
  };
};

type PaystackEnvelope = {
  status: boolean;
  message?: string;
  data?: PaystackTransaction;
};

export function isPaystackSecretKey(
  secretKey: string | undefined
): secretKey is string {
  return Boolean(
    secretKey?.startsWith("sk_test_") || secretKey?.startsWith("sk_live_")
  );
}

export async function verifyPaystackTransaction(
  reference: string
): Promise<PaystackTransaction> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!isPaystackSecretKey(secretKey)) {
    throw new Error(
      "PAYSTACK_SECRET_KEY must be a Paystack test or live secret key beginning with sk_test_ or sk_live_."
    );
  }

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
  if (
    !isPaystackSecretKey(secretKey) ||
    !signature ||
    !/^[\da-f]{128}$/i.test(signature)
  ) {
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
    if (transaction.status === "pending" || transaction.status === "ongoing") {
      return {
        paymentStatus: "pending",
        order: payment.order,
      };
    }
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
    const authorization = transaction.authorization;
    if (
      payment.savePaymentMethod &&
      payment.order.userId &&
      authorization?.reusable === true &&
      authorization.authorization_code &&
      authorization.signature &&
      authorization.last4 &&
      authorization.exp_month &&
      authorization.exp_year
    ) {
      const existingMethod = await transactionDb.savedPaymentMethod.findUnique({
        where: {
          userId_signature: {
            userId: payment.order.userId,
            signature: authorization.signature,
          },
        },
        select: { id: true },
      });
      const isFirstMethod =
        !existingMethod &&
        (await transactionDb.savedPaymentMethod.count({
          where: { userId: payment.order.userId },
        })) === 0;
      await transactionDb.savedPaymentMethod.upsert({
        where: {
          userId_signature: {
            userId: payment.order.userId,
            signature: authorization.signature,
          },
        },
        create: {
          userId: payment.order.userId,
          authorizationCodeEncrypted: encryptPaystackAuthorizationCode(
            authorization.authorization_code
          ),
          signature: authorization.signature,
          brand: authorization.brand || null,
          cardType: authorization.card_type || null,
          last4: authorization.last4,
          expMonth: authorization.exp_month,
          expYear: authorization.exp_year,
          bank: authorization.bank || null,
          isDefault: isFirstMethod,
        },
        update: {
          authorizationCodeEncrypted: encryptPaystackAuthorizationCode(
            authorization.authorization_code
          ),
          brand: authorization.brand || null,
          cardType: authorization.card_type || null,
          last4: authorization.last4,
          expMonth: authorization.exp_month,
          expYear: authorization.exp_year,
          bank: authorization.bank || null,
        },
      });
    }
    return true;
  });

  if (changed) {
    const safeOrderNumber = payment.order.orderNumber;
    try {
      await sendEmail({
        to: payment.order.customerEmail,
        subject: `Payment confirmed - Order #${safeOrderNumber}`,
        html: createPaymentConfirmationEmail({
          customerName: payment.order.customerName,
          orderNumber: String(safeOrderNumber),
          amount: payment.amountKobo / 100,
          orderStatus: payment.order.status,
        }),
      });
    } catch (error) {
      console.error("[PAYSTACK_PAYMENT_EMAIL]", error);
    }
  }

  return { paymentStatus: "paid", order: payment.order };
}
