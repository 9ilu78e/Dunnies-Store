"use client";

import { useEffect, useState } from "react";
import { Mail, MessageSquareText, RefreshCw } from "lucide-react";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  isReviewed: boolean;
  createdAt: string;
};

export default function AdminContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadMessages = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/contact-messages", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load messages.");
      setMessages(result.messages || []);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load messages."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMessages();
  }, []);

  const setReviewed = async (message: ContactMessage) => {
    setUpdatingId(message.id);
    setError("");
    try {
      const response = await fetch("/api/contact-messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          id: message.id,
          isReviewed: !message.isReviewed,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update message.");
      setMessages((current) =>
        current.map((item) => (item.id === message.id ? result.message : item))
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update message."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-4xl font-bold text-transparent">
            Contact Messages
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Review messages submitted through the storefront contact form.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadMessages()}
          disabled={loading}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {loading ? (
        <p className="py-10 text-center text-sm text-gray-500">Loading messages...</p>
      ) : messages.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white py-12 text-center">
          <MessageSquareText className="mx-auto mb-3 h-9 w-9 text-gray-300" />
          <p className="font-semibold text-gray-900">No contact messages</p>
          <p className="mt-1 text-sm text-gray-500">New messages will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`rounded-2xl border bg-white p-5 shadow-sm ${
                message.isReviewed ? "border-gray-200" : "border-purple-200"
              }`}
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900">
                      {message.subject}
                    </h2>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        message.isReviewed
                          ? "bg-gray-100 text-gray-600"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {message.isReviewed ? "Reviewed" : "New"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">
                    From <span className="font-semibold">{message.name}</span>
                    {" · "}
                    {new Date(message.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    <a
                      className="inline-flex items-center gap-1 text-purple-700 hover:underline"
                      href={`mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {message.email}
                    </a>
                    {message.phone && <span> · {message.phone}</span>}
                  </p>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {message.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void setReviewed(message)}
                  disabled={updatingId === message.id}
                  className="h-fit shrink-0 rounded-lg border border-purple-200 px-3 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50 disabled:opacity-60"
                >
                  {updatingId === message.id
                    ? "Saving..."
                    : message.isReviewed
                      ? "Mark as new"
                      : "Mark reviewed"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
