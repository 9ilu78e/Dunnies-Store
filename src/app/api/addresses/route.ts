import { NextRequest, NextResponse } from "next/server";
import { getOrCreateAccountUser } from "@/lib/accountUser";
import { prisma } from "@/lib/prisma";
import { verifyUserAuth } from "@/lib/authMiddleware";

type AddressInput = {
  label?: unknown;
  recipient?: unknown;
  phone?: unknown;
  line1?: unknown;
  line2?: unknown;
  city?: unknown;
  region?: unknown;
  postalCode?: unknown;
  country?: unknown;
  isDefault?: unknown;
};

function normalizeAddressInput(body: AddressInput) {
  const requiredValues = {
    label: typeof body.label === "string" ? body.label.trim() : "",
    recipient: typeof body.recipient === "string" ? body.recipient.trim() : "",
    phone: typeof body.phone === "string" ? body.phone.trim() : "",
    line1: typeof body.line1 === "string" ? body.line1.trim() : "",
    city: typeof body.city === "string" ? body.city.trim() : "",
  };
  if (Object.values(requiredValues).some((value) => !value)) return null;
  if (
    Object.entries(requiredValues).some(
      ([field, value]) => value.length > (field === "line1" ? 250 : 120)
    )
  ) {
    return null;
  }

  const optionalValue = (value: unknown) =>
    typeof value === "string" ? value.trim() || null : null;

  return {
    ...requiredValues,
    line2: optionalValue(body.line2),
    region: optionalValue(body.region),
    postalCode: optionalValue(body.postalCode),
    country:
      typeof body.country === "string" && body.country.trim()
        ? body.country.trim()
        : "Nigeria",
    isDefault: body.isDefault === true,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const account = await getOrCreateAccountUser(auth.user);
    const addresses = await prisma.address.findMany({
      where: { userId: account.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("[ADDRESSES_GET]", error);
    return NextResponse.json({ error: "Unable to load saved addresses." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const account = await getOrCreateAccountUser(auth.user);
    const body = (await request.json()) as AddressInput;
    const addressData = normalizeAddressInput(body);
    if (!addressData) {
      return NextResponse.json(
        { error: "Label, recipient, phone, street address, and city are required." },
        { status: 400 }
      );
    }

    const count = await prisma.address.count({ where: { userId: account.id } });
    if (count >= 20) {
      return NextResponse.json(
        { error: "You can save up to 20 delivery addresses." },
        { status: 400 }
      );
    }

    const address = await prisma.$transaction(async (transaction) => {
      const isDefault = addressData.isDefault || count === 0;
      if (isDefault) {
        await transaction.address.updateMany({
          where: { userId: account.id },
          data: { isDefault: false },
        });
      }
      return transaction.address.create({
        data: { ...addressData, isDefault, userId: account.id },
      });
    });

    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    console.error("[ADDRESSES_POST]", error);
    return NextResponse.json({ error: "Unable to save this address." }, { status: 500 });
  }
}
