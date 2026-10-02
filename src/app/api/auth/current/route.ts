import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getFirebaseAdminAuth } from "@/lib/firebaseAdmin";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get("auth_token")?.value;
    const verifiedEmail = request.cookies.get("email_verified")?.value;
    const emailUserId = request.cookies.get("userId")?.value;

    let responseUser;

    if (authToken) {
      try {
        const decodedToken =
          await getFirebaseAdminAuth().verifyIdToken(authToken);
        const user = await prisma.firebaseUser.findUnique({
          where: { uid: decodedToken.uid },
        });
        if (user) {
          responseUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.name,
            photoURL: user.photo,
            provider: user.provider,
            role: user.role,
          };
        }
      } catch {
        const decodedToken = jwt.verify(
          authToken,
          process.env.NEXTAUTH_SECRET || "your-secret-key"
        );
        if (typeof decodedToken !== "string" && typeof decodedToken.userId === "string") {
          const user = await prisma.user.findUnique({
            where: { id: decodedToken.userId },
          });
          if (user) {
            responseUser = {
              uid: user.id,
              email: user.email,
              displayName: user.fullName,
              photoURL: null,
              provider: "email",
              role: user.role,
            };
          }
        }
      }
    } else if (verifiedEmail && emailUserId) {
      const user = await prisma.firebaseUser.findFirst({
        where: {
          email: { equals: decodeURIComponent(verifiedEmail), mode: "insensitive" },
          uid: emailUserId,
        },
      });
      if (user) {
        responseUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.name,
          photoURL: user.photo,
          provider: user.provider,
          role: user.role,
        };
      }
    }

    if (!responseUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ user: responseUser });
  } catch (error) {
    console.error("Current user lookup failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("jwt") || message.includes("token") ? 401 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Unauthorized" : "Unable to load current user" },
      { status }
    );
  }
}
