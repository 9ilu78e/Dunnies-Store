"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";

type SendResult = {
  total: number;
  successful: number;
  failed: number;
  message: string;
};

export default function AdminNewsletterPage() {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [error, setError] = useState("");

  const sendNewsletter = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setResult(null);
    setError("");
    try {
      const response = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ subject, content }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to send newsletter.");
      setResult(data);
      if (data.total > 0) {
        setSubject("");
        setContent("");
      }
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Unable to send newsletter."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-4xl font-bold text-transparent">
          Newsletter
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Write an update for users who have subscribed to store emails.
        </p>
      </header>
      <form
        onSubmit={sendNewsletter}
        className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7"
      >
        <div>
          <label htmlFor="newsletter-subject" className="mb-1 block text-sm font-semibold text-gray-700">
            Subject
          </label>
          <input
            id="newsletter-subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            maxLength={180}
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
          />
        </div>
        <div>
          <label htmlFor="newsletter-content" className="mb-1 block text-sm font-semibold text-gray-700">
            Newsletter content
          </label>
          <textarea
            id="newsletter-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={50000}
            required
            rows={12}
            className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
          />
          <p className="mt-1 text-xs text-gray-500">
            Plain text; line breaks are preserved in the email.
          </p>
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {result && (
          <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
            {result.message} {result.failed > 0 && `${result.failed} delivery(ies) failed.`}
          </p>
        )}
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-5 py-3 font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {sending ? "Sending..." : "Send to subscribers"}
        </button>
      </form>
    </div>
  );
}
