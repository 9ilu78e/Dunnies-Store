import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/services/authService";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('Current user check:', user);

    return NextResponse.json({
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: user.provider,
        role: user.role || 'user'
      },
    });
  } catch (error) {
    console.error("Current user error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

