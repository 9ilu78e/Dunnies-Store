import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { getFirebaseAdminAuth } from "@/lib/firebaseAdmin";
import { prisma } from "@/lib/prisma";

export type AdminAccountSource = "user" | "firebaseUser";

export interface AdminActor {
  id: string;
  source: AdminAccountSource;
}

export async function getAdminActor(
  request: NextRequest
): Promise<AdminActor | null> {
  const authToken = request.cookies.get("auth_token")?.value;

  if (authToken) {
    try {
      const decoded = await getFirebaseAdminAuth().verifyIdToken(authToken);
      const account = await prisma.firebaseUser.findUnique({
        where: { uid: decoded.uid },
        select: { id: true, role: true },
      });
      if (account?.role.toLowerCase() === "admin") {
        return { id: account.id, source: "firebaseUser" };
      }
      return null;
    } catch {
      try {
        const decoded = jwt.verify(
          authToken,
          process.env.NEXTAUTH_SECRET || "your-secret-key"
        );
        if (typeof decoded === "string" || typeof decoded.userId !== "string") {
          return null;
        }
        const account = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, role: true },
        });
        if (account?.role.toLowerCase() === "admin") {
          return { id: account.id, source: "user" };
        }
        return null;
      } catch {
        return null;
      }
    }
  }

  const verifiedEmail = request.cookies.get("email_verified")?.value;
  const userId = request.cookies.get("userId")?.value;
  if (!verifiedEmail || !userId) return null;

  const account = await prisma.firebaseUser.findFirst({
    where: {
      email: { equals: decodeURIComponent(verifiedEmail), mode: "insensitive" },
      uid: userId,
    },
    select: { id: true, role: true },
  });

  return account?.role.toLowerCase() === "admin"
    ? { id: account.id, source: "firebaseUser" }
    : null;
}
