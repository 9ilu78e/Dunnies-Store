"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, ShieldCheck, X } from "lucide-react";
import { signOutFirebase } from "@/services/firebaseAuth";

interface AdminLogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminLogoutModal({
  isOpen,
  onClose,
}: AdminLogoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    setError("");

    try {
      await signOutFirebase();
      onClose();
      router.replace("/login");
      router.refresh();
    } catch (logoutError) {
      console.error("Admin logout failed:", logoutError);
      setError("Could not end the admin session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close admin logout confirmation"
        disabled={loading}
        className="absolute inset-0 bg-white/10 backdrop-blur-sm"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-logout-title"
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between bg-gradient-to-r from-purple-700 to-pink-600 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-purple-100">
                Dunnis Admin
              </p>
              <h2 id="admin-logout-title" className="text-base font-bold">
                End admin session?
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            className="rounded-lg p-1 text-white/80 transition hover:bg-white/15 hover:text-white disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm leading-5 text-gray-600">
            You’ll be signed out of the admin dashboard and returned to the sign-in page.
          </p>
          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="mt-5 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-purple-200 px-3.5 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-50 disabled:opacity-50"
            >
              Stay signed in
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:from-purple-700 hover:to-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  Sign out
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
