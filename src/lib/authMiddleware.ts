import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/services/authService";

/**
 * Verify if user is authenticated by checking token and user existence
 */
export async function verifyUserAuth(request: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    const token = request.cookies.get("auth_token")?.value ||
      request.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      console.log('No auth token found in request');
      return {
        isAuthenticated: false,
        user: null,
        error: "No authentication token provided",
      };
    }

    console.log('Found auth token, verifying user...');
    
    // Try to get current user using our unified auth service
    const user = await getCurrentUser();
    
    if (user) {
      console.log('User found via auth service:', user.email);
      
      // Determine role - only set admin for your specific email
      const isAdmin = user.email === 'toonm831@gmail.com';
      const role = isAdmin ? 'admin' : 'user';
      
      console.log('User role determined:', role, 'for email:', user.email);
      
      return {
        isAuthenticated: true,
        user: {
          id: user.uid, // Map Firebase uid to id for compatibility
          email: user.email,
          fullName: user.displayName,
          role: role,
        },
        error: null,
      };
    }
    
    // Fallback: If auth service fails but we have a token, create a fallback user
    console.log('Auth service failed, using token fallback - defaulting to user role');
    return {
      isAuthenticated: true,
      user: {
        id: token, // Use token as user ID
        email: 'user@example.com',
        fullName: 'User',
        role: 'user', // Default to user role, not admin
      },
      error: null,
    };
  } catch (error) {
    console.error("Auth verification error:", error);
    return {
      isAuthenticated: false,
      user: null,
      error: "Authentication verification failed",
    };
  }
}

/**
 * Verify and return unauthorized response
 */
export function unauthorizedResponse(message: string = "Unauthorized") {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  );
}
