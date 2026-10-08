import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUserAuth } from "@/lib/authMiddleware";
import { formatOrderNumber } from "@/lib/orderNumber";

const ORDER_CODE_SPACE = 26 * 36 ** 5;
const ORDER_CODE_MULTIPLIER = 104729;
const ORDER_CODE_OFFSET = 987654321;

function modularInverse(value: number, modulus: number): number {
  let oldR = value;
  let r = modulus;
  let oldS = 1;
  let s = 0;

  while (r !== 0) {
    const quotient = Math.floor(oldR / r);
    [oldR, r] = [r, oldR - quotient * r];
    [oldS, s] = [s, oldS - quotient * s];
  }

  if (oldR !== 1) {
    throw new Error("Order number encoding is not reversible.");
  }

  return ((oldS % modulus) + modulus) % modulus;
}

function parseOrderNumber(input: string): number | null {
  const query = input.trim().toUpperCase();
  if (/^\d+$/.test(query)) {
    const orderNumber = Number(query);
    return Number.isSafeInteger(orderNumber) && orderNumber > 0
      ? orderNumber
      : null;
  }

  if (!/^[A-Z][0-9A-Z]{5}$/.test(query)) return null;
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const encoded =
    (query.charCodeAt(0) - 65) * 36 ** 5 +
    [...query.slice(1)].reduce(
      (value, character) => value * 36 + alphabet.indexOf(character),
      0
    );
  const inverse = modularInverse(ORDER_CODE_MULTIPLIER, ORDER_CODE_SPACE);
  const modulus = BigInt(ORDER_CODE_SPACE);
  const sequence =
    ((BigInt(encoded - ORDER_CODE_OFFSET) * BigInt(inverse)) % modulus +
      modulus) %
    modulus;
  const orderNumber = Number(sequence) + 1;
  return formatOrderNumber(orderNumber) === query ? orderNumber : null;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }
    if (auth.user.role.toLowerCase() !== "admin") {
      return NextResponse.json(
        { error: "Admin access is required to search orders." },
        { status: 403 }
      );
    }

    const query = new URL(request.url).searchParams.get("query") || "";
    if (!query.trim() || query.trim().length > 32) {
      return NextResponse.json(
        { error: "Enter an order ID to search." },
        { status: 400 }
      );
    }
    const orderNumber = parseOrderNumber(query);
    if (!orderNumber) {
      return NextResponse.json(
        { error: "Enter a valid numeric order number or six-character order code." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        orderNumber: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        status: true,
        paymentStatus: true,
        total: true,
        createdAt: true,
        orderItems: {
          select: {
            quantity: true,
            product: { select: { name: true } },
            gift: { select: { name: true } },
            souvenir: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({
      order: order
        ? {
            ...order,
            orderCode: formatOrderNumber(order.orderNumber),
          }
        : null,
    });
  } catch (error) {
    console.error("[LIVE_CHAT_ORDER_SEARCH]", error);
    return NextResponse.json(
      { error: "Unable to search orders right now." },
      { status: 500 }
    );
  }
}
