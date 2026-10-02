"use client";

import { useState, useEffect } from "react";
import { X, Cookie } from "lucide-react";
import Link from "next/link";
import { showToast } from "@/components/ui/Toast";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasConsent = localStorage.getItem("cookieConsent");
    if (!hasConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem("cookieConsent", "accepted");
      setIsVisible(false);
      showToast("Cookie preferences saved.", "success");
    } catch (error) {
      console.error("Unable to save cookie preferences:", error);
      showToast(
        "Could not save cookie preferences. Please try again.",
        "error"
      );
    }
  };

  const handleDecline = () => {
    try {
      localStorage.setItem("cookieConsent", "declined");
      setIsVisible(false);
    } catch (error) {
      console.error("Unable to save cookie preferences:", error);
      showToast(
        "Could not save cookie preferences. Please try again.",
        "error"
      );
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <Cookie className="w-6 h-6 text-purple-600 shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Cookie Preferences
              </h3>
              <p className="text-sm text-gray-600">
                We use cookies to enhance your browsing experience and analyze
                site traffic. By continuing to use our site, you agree to our
                use of cookies. Read our{" "}
                <Link
                  href="/privacy"
                  className="text-purple-600 hover:underline font-medium"
                >
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link
                  href="/terms"
                  className="text-purple-600 hover:underline font-medium"
                >
                  Terms of Service
                </Link>{" "}
                for more information.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleDecline}
              className="flex-1 sm:flex-initial px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 sm:flex-initial px-6 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-full transition"
            >
              Accept
            </button>
          </div>
          <button
            onClick={handleDecline}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 sm:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
