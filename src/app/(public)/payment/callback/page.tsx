"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, LoaderCircle, XCircle } from "lucide-react";
import { formatOrderNumber } from "@/lib/orderNumber";

type VerificationState = {
  status: "checking" | "paid" | "failed";
  message: string;
  orderNumber?: number;
};

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const [result, setResult] = useState<VerificationState>({
    status: "checking",
    message: "Verifying your payment securely...",
  });

  useEffect(() => {
    let active = true;
    const verify = async () => {
      if (!reference) {
        setResult({ status: "failed", message: "No payment reference was provided." });
        return;
      }
      try {
        const response = await fetch("/api/paystack/verify", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "We could not verify this payment.");
        }
        if (active) {
          setResult({
            status: data.paymentStatus === "paid" ? "paid" : "failed",
            orderNumber: data.orderNumber,
            message:
              data.paymentStatus === "paid"
                ? "Payment confirmed. Your order can now proceed through the normal delivery process; it has not been marked as delivered."
                : "Payment was not successful. You can retry from My Orders.",
          });
        }
      } catch (error) {
        if (active) {
          setResult({
            status: "failed",
            message:
              error instanceof Error
                ? error.message
                : "We could not verify this payment. You can retry from My Orders.",
          });
        }
      }
    };
    void verify();
    return () => {
      active = false;
    };
  }, [reference]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4 py-12">
      <section className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-lg sm:p-10">
        {result.status === "checking" ? (
          <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-purple-600" />
        ) : result.status === "paid" ? (
          <CheckCircle className="mx-auto h-14 w-14 text-emerald-500" />
        ) : (
          <XCircle className="mx-auto h-14 w-14 text-red-500" />
        )}
        <h1 className="mt-5 text-2xl font-bold text-gray-900">
          {result.status === "checking"
            ? "Checking payment"
            : result.status === "paid"
              ? "Payment successful"
              : "Payment not confirmed"}
        </h1>
        <p className="mt-3 text-gray-600">{result.message}</p>
        {result.orderNumber && (
          <p className="mt-4 text-sm font-semibold text-gray-800">
            Order #{formatOrderNumber(result.orderNumber)}
          </p>
        )}
        {result.status !== "checking" && (
          <div className="mt-7 flex flex-col gap-3">
            <Link href="/orders" className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700">
              View my orders
            </Link>
            {result.status === "failed" && (
              <Link href="/cart" className="rounded-xl border border-gray-200 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50">
                Continue shopping
              </Link>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4 py-12">
          <LoaderCircle className="h-12 w-12 animate-spin text-purple-600" />
        </main>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}
