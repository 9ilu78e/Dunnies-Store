import { NextRequest, NextResponse } from "next/server";
import { comparePasswords, hashPassword } from "@/lib/auth";
import { getOrCreateAccountUser } from "@/lib/accountUser";
import { prisma } from "@/lib/prisma";
import { verifyUserAuth } from "@/lib/authMiddleware";

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await request.json();
    const currentPassword =
      typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    if (!currentPassword || newPassword.length < 8 || newPassword.length > 128) {
      return NextResponse.json(
        { error: "Enter your current password and a new password of at least 8 characters." },
        { status: 400 }
      );
    }

    const account = await getOrCreateAccountUser(auth.user);
    if (!(await comparePasswords(currentPassword, account.password))) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: account.id },
      data: { password: await hashPassword(newPassword) },
    });
    return NextResponse.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("[ACCOUNT_PASSWORD_PATCH]", error);
    return NextResponse.json({ error: "Unable to update password." }, { status: 500 });
  }
}
