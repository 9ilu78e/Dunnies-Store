"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CreditCard, Plus, ShieldCheck, Trash2 } from "lucide-react";

type SavedPaymentMethod = {
  id: string;
  brand: string | null;
  cardType: string | null;
  last4: string;
  expMonth: string;
  expYear: string;
  bank: string | null;
  isDefault: boolean;
};

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const loadMethods = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/payment-methods", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to load saved payment methods.");
      }
      setMethods(Array.isArray(data.paymentMethods) ? data.paymentMethods : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load saved payment methods."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMethods();
  }, [loadMethods]);

  const updateMethod = async (
    method: SavedPaymentMethod,
    action: "default" | "remove"
  ) => {
    setBusyId(method.id);
    setError("");
    try {
      const response = await fetch(`/api/payment-methods/${method.id}`, {
        method: action === "remove" ? "DELETE" : "PATCH",
        credentials: "same-origin",
        headers:
          action === "default" ? { "Content-Type": "application/json" } : undefined,
        body: action === "default" ? JSON.stringify({ action }) : undefined,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to update this payment method.");
      }
      await loadMethods();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update this payment method."
      );
    } finally {
      setBusyId("");
    }
  };

  return (
    <section className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-widest text-purple-600">
            Payments
          </p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">Payment methods</h1>
          <p className="mt-2 text-gray-600">
            Choose a saved card for Paystack checkout or remove cards you no longer use.
          </p>
        </header>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <p className="rounded-2xl bg-white p-8 text-center text-sm text-gray-500">
            Loading saved payment methods...
          </p>
        ) : methods.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {methods.map((method) => (
              <article
                key={method.id}
                className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {method.brand || method.cardType || "Card"} •••• {method.last4}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Expires {method.expMonth}/{method.expYear}
                      {method.bank ? ` · ${method.bank}` : ""}
                    </p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <CreditCard className="h-5 w-5" />
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  {method.isDefault ? (
                    <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                      Default for Paystack
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={Boolean(busyId)}
                      onClick={() => void updateMethod(method, "default")}
                      className="text-sm font-semibold text-purple-700 hover:text-purple-900 disabled:opacity-50"
                    >
                      {busyId === method.id ? "Updating..." : "Make default"}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={Boolean(busyId)}
                    onClick={() => void updateMethod(method, "remove")}
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <CreditCard className="mx-auto h-9 w-9 text-purple-500" />
            <h2 className="mt-3 font-semibold text-gray-900">No saved cards yet</h2>
            <p className="mx-auto mt-1 max-w-lg text-sm text-gray-600">
              Save an eligible card securely through Paystack while paying for your next order.
              We never store your full card number.
            </p>
            <Link
              href="/product"
              onClick={() => sessionStorage.setItem("dunnis:savePaymentMethod", "true")}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" />
              Shop and save a card
            </Link>
          </div>
        )}

        <div className="flex gap-3 rounded-2xl border border-gray-200 bg-white p-5">
          <ShieldCheck className="h-6 w-6 shrink-0 text-green-600" />
          <div>
            <h2 className="font-semibold text-gray-900">Secure Paystack payments</h2>
            <p className="mt-1 text-sm text-gray-600">
              Saved payment authorizations are encrypted and used only for Paystack charges you choose at checkout.
              You can remove a saved card here at any time.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
