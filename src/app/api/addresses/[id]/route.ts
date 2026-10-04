import { NextRequest, NextResponse } from "next/server";
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
  const requiredFields = ["label", "recipient", "phone", "line1", "city"] as const;
  const data: Record<string, string | boolean | null> = {};
  for (const field of requiredFields) {
    if (field in body) {
      if (typeof body[field] !== "string" || !body[field].trim()) return null;
      data[field] = body[field].trim();
    }
  }
  for (const field of ["line2", "region", "postalCode"] as const) {
    if (field in body) {
      if (typeof body[field] !== "string" && body[field] !== null) return null;
      data[field] = typeof body[field] === "string" ? body[field].trim() || null : null;
    }
  }
  if ("country" in body) {
    if (typeof body.country !== "string" || !body.country.trim()) return null;
    data.country = body.country.trim();
  }
  if ("isDefault" in body) {
    if (typeof body.isDefault !== "boolean") return null;
    data.isDefault = body.isDefault;
  }
  return data;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const account = await prisma.user.findFirst({
      where: { email: { equals: auth.user.email, mode: "insensitive" } },
      select: { id: true },
    });
    if (!account) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    const { id } = await params;
    const body = (await request.json()) as AddressInput;
    const data = normalizeAddressInput(body);
    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Enter valid address details." }, { status: 400 });
    }
    const existing = await prisma.address.findFirst({
      where: { id, userId: account.id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Address not found." }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (transaction) => {
      if (data.isDefault === true) {
        await transaction.address.updateMany({
          where: { userId: account.id, id: { not: id } },
          data: { isDefault: false },
        });
      }
      return transaction.address.update({
        where: { id },
        data,
      });
    });
    return NextResponse.json({ address: updated });
  } catch (error) {
    console.error("[ADDRESS_PATCH]", error);
    return NextResponse.json({ error: "Unable to update this address." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const account = await prisma.user.findFirst({
      where: { email: { equals: auth.user.email, mode: "insensitive" } },
      select: { id: true },
    });
    if (!account) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    const { id } = await params;
    const address = await prisma.address.findFirst({
      where: { id, userId: account.id },
    });
    if (!address) {
      return NextResponse.json({ error: "Address not found." }, { status: 404 });
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.address.delete({ where: { id } });
      if (address.isDefault) {
        const replacement = await transaction.address.findFirst({
          where: { userId: account.id },
          orderBy: { createdAt: "asc" },
        });
        if (replacement) {
          await transaction.address.update({
            where: { id: replacement.id },
            data: { isDefault: true },
          });
        }
      }
    });
    return NextResponse.json({ message: "Address deleted." });
  } catch (error) {
    console.error("[ADDRESS_DELETE]", error);
    return NextResponse.json({ error: "Unable to delete this address." }, { status: 500 });
  }
}
