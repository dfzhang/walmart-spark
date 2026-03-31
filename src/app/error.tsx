"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
      <p className="text-gray-500 mb-6">
        We&apos;re having trouble loading this page. Please try again.
      </p>
      <button
        onClick={reset}
        className="bg-spark-blue text-white px-6 py-2 rounded-lg font-medium hover:bg-spark-blue-dark transition-colors focus:outline-none focus:ring-2 focus:ring-spark-blue focus:ring-offset-2"
      >
        Try again
      </button>
    </div>
  );
}
