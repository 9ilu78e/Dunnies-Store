"use client";

import { useState, type FormEvent } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const subscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to subscribe.");
      setMessage(result.message);
      setEmail("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to subscribe.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-gradient-to-r from-purple-600 to-pink-600 py-16">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
          Subscribe to Our Newsletter
        </h2>
        <p className="mb-8 text-lg text-purple-100">
          Get exclusive deals, new arrivals, and special offers delivered to your inbox
        </p>
        <form
          onSubmit={subscribe}
          className="mx-auto flex max-w-md flex-col gap-4 sm:flex-row"
        >
          <input
            type="email"
            placeholder="Enter your email"
            aria-label="Email address"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="flex-1 rounded-full border border-white bg-white px-6 py-4 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-4 focus:ring-white/50"
          />
          <button
            type="submit"
            disabled={submitting}
            className="whitespace-nowrap rounded-full bg-white px-8 py-4 font-semibold text-purple-600 transition-all hover:bg-gray-100 disabled:opacity-60"
          >
            {submitting ? "Subscribing..." : "Subscribe"}
          </button>
        </form>
        {message && (
          <p role="status" className="mt-4 text-sm text-white">
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
