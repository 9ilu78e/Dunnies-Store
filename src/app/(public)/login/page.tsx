"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Mail } from "lucide-react";
import { signInWithGoogle } from "@/lib/firebase";
import { showToast } from "@/components/ui/Toast";

const USER_INTERFACE_PATH = "/users-interface";
const ADMIN_DASHBOARD_PATH = "/dashboard";

const resolveRoleDestination = (role?: string | null) => {
  const normalizedRole = role?.toLowerCase();

  if (normalizedRole === "admin") {
    return ADMIN_DASHBOARD_PATH;
  }

  if (normalizedRole === "users" || normalizedRole === "user") {
    return USER_INTERFACE_PATH;
  }

  return USER_INTERFACE_PATH;
};

export default function LoginPage() {
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    setError("");
    setSuccess("");
    setIsEmailLoading(true);

    try {
      if (!email) {
        setError("Email is required");
        setIsEmailLoading(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError("Invalid email format");
        setIsEmailLoading(false);
        return;
      }

      // Send verification email
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification email');
      }

      showToast("Verification link sent! Check your email.", "success");

    } catch (error: any) {
      console.error('Login Error:', error);
      setError(error.message || 'Failed to send verification email');
      showToast(error.message || 'Failed to send verification email', 'error');
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsGoogleLoading(true);

    try {
      const data = await signInWithGoogle();
      console.log("Google Sign-In response:", data);

      if (data.user?.uid) {
        localStorage.setItem("userId", data.user.uid);
        // Also set a simple auth token cookie for server-side validation
        document.cookie = `auth_token=${data.token}; path=/; max-age=3600; SameSite=Lax`;
      }

      // Show success popup
      showToast("Login successful! Redirecting...", "success");

      // Determine destination based on user role
      let destination = '/users-interface'; // default for users
      
      console.log('=== GOOGLE LOGIN REDIRECT LOGIC ===');
      console.log('Google login user data:', data.user);
      console.log('User role from API:', data.user?.role);
      console.log('User email:', data.user?.email);
      
      // Additional admin check for debugging
      const knownAdminEmails = ['toonm831@gmail.com'];
      const isAdminByEmail = knownAdminEmails.includes(data.user?.email || '');
      console.log('Is admin by email check:', isAdminByEmail);
      
      if (data.user?.role === 'admin') {
        destination = '/dashboard'; // admin dashboard
        console.log('✅ Admin detected by role, redirecting to:', destination);
      } else if (isAdminByEmail) {
        destination = '/dashboard'; // admin dashboard
        console.log('⚠️ Admin detected by email fallback, redirecting to:', destination);
      } else {
        console.log('👤 Regular user detected, redirecting to:', destination);
      }

      console.log("Redirecting to:", destination);
      
      // Redirect after a short delay to show the toast
      setTimeout(() => {
        router.push(destination);
      }, 1500);

    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      showToast(error.message || "Google Sign-In failed", "error");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 text-xl">Sign in to continue</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl border border-purple-100 p-8 backdrop-blur-sm">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Email Input Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  disabled={isEmailLoading}
                />
              </div>
            </div>

            {/* Email Login Button */}
            <button
              type="button"
              onClick={handleLogin}
              disabled={isEmailLoading || !email}
              className="w-full flex justify-center items-center py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isEmailLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Sending Verification...
                </>
              ) : (
                'Login'
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full flex justify-center items-center py-4 border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg
                  className="w-6 h-6 group-hover:scale-110 transition-transform"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              <span className="ml-2 text-base font-medium text-gray-700 group-hover:text-gray-900">
                Continue with Google
              </span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
