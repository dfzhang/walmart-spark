"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-gray-500 mb-6">
            We&apos;re having trouble loading the Help Center. Please try again.
          </p>
          <button
            onClick={reset}
            className="bg-[#0071DC] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#004F9A] transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
