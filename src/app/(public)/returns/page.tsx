import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SupportEmailLink from "@/components/layout/SupportEmailLink";

export const metadata = {
  title: "Return Policy | Dunnis Stores",
  description: "Learn how to contact Dunnis Stores about a return or order issue.",
};

export default function ReturnsPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-purple-600 hover:text-purple-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
        <h1 className="text-4xl font-bold text-gray-900">Return Policy</h1>
        <p className="mt-3 text-gray-600">
          We want you to be happy with your order. If an item arrives damaged,
          incorrect, or you have another concern, contact our support team as
          soon as possible with your order number and a description of the issue.
        </p>
        <section className="mt-8 space-y-4 text-gray-700">
          <h2 className="text-2xl font-bold text-gray-900">How to get help</h2>
          <p>
            Email{" "}
            <SupportEmailLink />{" "}
            or use our <Link className="font-semibold text-purple-700 underline" href="/contact">contact page</Link>.
            Include the order number and clear photos where relevant. Our team
            will review the request and explain the available next steps.
          </p>
          <p>
            Return or replacement options depend on the item and the details of
            the order. Please wait for support to confirm the next step before
            sending an item back.
          </p>
        </section>
      </div>
    </main>
  );
}
