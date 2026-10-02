"use client";

import { useState } from "react";
import { LogOut, X, Loader2 } from "lucide-react";
import { signOutFirebase } from "@/services/firebaseAuth";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoggedOut: () => void;
}

export default function LogoutModal({
  isOpen,
  onClose,
  onLoggedOut,
}: LogoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogout = async () => {
    setLoading(true);
    setError("");
    try {
      await signOutFirebase();
      onLoggedOut();
      onClose();
      window.location.replace("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      setError("Logout could not be completed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => !loading && onClose()}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
            <LogOut className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Logout?</h3>
          <p className="text-gray-600 text-sm">Your cart will be saved</p>
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 border-2 border-purple-600 text-purple-600 rounded-xl font-medium hover:bg-purple-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="flex-1 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Logging out...
              </>
            ) : (
              "Logout"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
