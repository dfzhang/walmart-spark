"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export function FeedbackWidget({
  articleId,
  locale = "en",
}: {
  articleId: string;
  locale?: Locale;
}) {
  const dict = getDictionary(locale);
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);

  function handleFeedback(value: "yes" | "no") {
    setFeedback(value);
    // TODO: Send to analytics
  }

  if (feedback) {
    return (
      <div className="mt-8 p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-600" role="status" aria-live="polite">
        {dict.article.feedback.thanks}
      </div>
    );
  }

  return (
    <div className="mt-8 p-4 bg-gray-50 rounded-lg text-center">
      <p className="text-sm text-gray-600 mb-2">{dict.article.feedback.question}</p>
      <div className="flex justify-center gap-3">
        <button
          onClick={() => handleFeedback("yes")}
          className="px-4 py-1.5 rounded-full border border-gray-300 text-sm hover:bg-green-50 hover:border-green-300 transition-colors focus:outline-none focus:ring-2 focus:ring-spark-blue focus:ring-offset-2"
          aria-label={dict.article.feedback.yesLabel}
        >
          👍 {dict.article.feedback.yes}
        </button>
        <button
          onClick={() => handleFeedback("no")}
          className="px-4 py-1.5 rounded-full border border-gray-300 text-sm hover:bg-red-50 hover:border-red-300 transition-colors focus:outline-none focus:ring-2 focus:ring-spark-blue focus:ring-offset-2"
          aria-label={dict.article.feedback.noLabel}
        >
          👎 {dict.article.feedback.no}
        </button>
      </div>
    </div>
  );
}
