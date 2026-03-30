"use client";

import { useState } from "react";

export function FeedbackWidget({ articleId }: { articleId: string }) {
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);

  function handleFeedback(value: "yes" | "no") {
    setFeedback(value);
    // TODO: Send to analytics
    console.log("Feedback:", { articleId, helpful: value });
  }

  if (feedback) {
    return (
      <div className="mt-8 p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-600">
        Thanks for your feedback!
      </div>
    );
  }

  return (
    <div className="mt-8 p-4 bg-gray-50 rounded-lg text-center">
      <p className="text-sm text-gray-600 mb-2">Was this article helpful?</p>
      <div className="flex justify-center gap-3">
        <button
          onClick={() => handleFeedback("yes")}
          className="px-4 py-1.5 rounded-full border border-gray-300 text-sm hover:bg-green-50 hover:border-green-300 transition-colors"
        >
          👍 Yes
        </button>
        <button
          onClick={() => handleFeedback("no")}
          className="px-4 py-1.5 rounded-full border border-gray-300 text-sm hover:bg-red-50 hover:border-red-300 transition-colors"
        >
          👎 No
        </button>
      </div>
    </div>
  );
}
