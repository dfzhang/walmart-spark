"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

type Severity = "announcement" | "warning" | "critical";

interface NotificationBannerProps {
  message: string;
  severity: Severity;
  locale?: Locale;
}

const SEVERITY_STYLES: Record<Severity, string> = {
  announcement: "bg-spark-blue text-white",
  warning: "bg-spark-yellow text-gray-900",
  critical: "bg-red-600 text-white",
};

const DISMISS_STYLES: Record<Severity, string> = {
  announcement:
    "text-white/80 hover:text-white focus:ring-white",
  warning:
    "text-gray-700 hover:text-gray-900 focus:ring-gray-900",
  critical:
    "text-white/80 hover:text-white focus:ring-white",
};

export function NotificationBanner({ message, severity, locale = "en" }: NotificationBannerProps) {
  const dict = getDictionary(locale);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  // Critical banners use role="alert" (assertive) — screen readers announce immediately.
  // Announcement/warning use role="status" (polite) — announced at next pause.
  const role = severity === "critical" ? "alert" : "status";
  const ariaLive = severity === "critical" ? "assertive" : "polite";

  return (
    <div
      role={role}
      aria-live={ariaLive}
      className={`${SEVERITY_STYLES[severity]} relative`}
    >
      <div className="mx-auto max-w-5xl px-4 py-3 pr-12 text-center text-sm font-medium">
        {message}
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label={dict.banner.dismiss}
        className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${DISMISS_STYLES[severity]}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}
