"use client";

import { useIsPresentationTool } from "next-sanity/hooks";

/**
 * Renders a "Draft Mode" indicator with a disable link.
 * Hidden when inside the Presentation Tool iframe (the Studio
 * controls draft mode there).
 */
export function DisableDraftMode() {
  const isPresentationTool = useIsPresentationTool();

  // Don't show the banner inside the Studio iframe —
  // the Presentation Tool manages draft mode itself
  if (isPresentationTool) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <a
        href="/api/draft-mode/disable"
        className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-spark-blue focus:ring-offset-2"
      >
        <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
        Draft Mode — Click to disable
      </a>
    </div>
  );
}
