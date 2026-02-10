"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, CheckCircle, XCircle } from "lucide-react";
import { showToast } from "@/components/ui/Toast";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch(`/api/auth/send-verification?token=${token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      console.log("Verification successful:", data);

      setStatus('success');
      setEmail(data.email);
      setMessage('Email verified successfully! Redirecting to your dashboard...');
      showToast('Email verified! Welcome to Dunnis Stores.', 'success');

      // Determine destination based on user role
      let destination = '/users-interface'; // default for users
      
      if (data.user?.role === 'admin') {
        destination = '/admin'; // admin dashboard
      }

      console.log("User data:", data.user);
      console.log("User role:", data.user?.role);
      console.log("Redirecting to:", destination);

      // Redirect to appropriate dashboard after 2 seconds
      setTimeout(() => {
        console.log("Executing redirect to:", destination);
        router.push(destination);
      }, 2000);

    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Failed to verify email');
      showToast(error.message || 'Verification failed', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl border border-purple-100 p-8 backdrop-blur-sm text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email</h1>
              <p className="text-gray-600">Please wait while we verify your email...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
              <p className="text-gray-600 mb-4">{message}</p>
              {email && (
                <p className="text-sm text-gray-500 mb-4">
                  Verified email: {email}
                </p>
              )}
              <div className="flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-purple-600 animate-spin mr-2" />
                <span className="text-sm text-purple-600">Redirecting to your dashboard...</span>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm font-medium">{message}</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/login')}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium"
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
