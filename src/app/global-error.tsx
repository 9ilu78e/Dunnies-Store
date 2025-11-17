"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-br from-purple-50 to-pink-50 p-4">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 mb-8">
              We're sorry, but something unexpected happened.
            </p>
            <button
              onClick={reset}
              className="px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
