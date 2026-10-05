import { NextRequest, NextResponse } from "next/server";
import {
  isValidPaystackSignature,
  settlePaystackPayment,
  verifyPaystackTransaction,
} from "@/lib/paystack";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!isValidPaystackSignature(rawBody, request.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody) as {
      event?: string;
      data?: { reference?: unknown };
    };
    if (event.event !== "charge.success") {
      return NextResponse.json({ received: true });
    }
    if (typeof event.data?.reference !== "string") {
      return NextResponse.json({ error: "Missing payment reference." }, { status: 400 });
    }

    const reference = event.data.reference;
    const transaction = await verifyPaystackTransaction(reference);
    await settlePaystackPayment(reference, transaction);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[PAYSTACK_WEBHOOK]", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
