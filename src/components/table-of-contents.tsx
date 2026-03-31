"use client";

import { useEffect, useRef, useState } from "react";
import type { TocHeading } from "@/lib/headings";

const INDENT: Record<number, string> = {
  2: "",
  3: "pl-4",
  4: "pl-8",
};

/**
 * Sticky Table of Contents with IntersectionObserver-based
 * active section highlighting.
 *
 * Desktop: sticky sidebar, always visible.
 * Mobile: collapsible panel above the article.
 */
export function TableOfContents({
  headings,
  label = "On this page",
}: {
  headings: TocHeading[];
  label?: string;
}) {
  const [activeId, setActiveId] = useState<string>("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Observe all heading elements that have IDs matching our TOC
    const headingIds = new Set(headings.map((h) => h.id));
    const elements = Array.from(document.querySelectorAll("h2[id], h3[id], h4[id]"))
      .filter((el) => headingIds.has(el.id));

    if (elements.length === 0) return;

    // Track which headings are currently visible
    const visibleSet = new Set<string>();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleSet.add(entry.target.id);
          } else {
            visibleSet.delete(entry.target.id);
          }
        }

        // Activate the first visible heading (in document order)
        if (visibleSet.size > 0) {
          const first = elements.find((el) => visibleSet.has(el.id));
          if (first) setActiveId(first.id);
        }
      },
      {
        // Trigger when heading enters the top 20% of viewport
        rootMargin: "0px 0px -80% 0px",
        threshold: 0,
      }
    );

    for (const el of elements) {
      observerRef.current.observe(el);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [headings]);

  if (headings.length === 0) return null;

  const tocList = (
    <nav aria-label={label}>
      <ul className="space-y-1 text-sm">
        {headings.map((heading) => {
          const isActive = activeId === heading.id;
          return (
            <li key={heading.id} className={INDENT[heading.level]}>
              <a
                href={`#${heading.id}`}
                onClick={() => setMobileOpen(false)}
                className={`block py-1 px-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-spark-blue ${
                  isActive
                    ? "text-spark-blue font-medium bg-blue-50 border-l-2 border-spark-blue"
                    : "text-gray-600 hover:text-spark-blue hover:bg-gray-50 border-l-2 border-transparent"
                }`}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <>
      {/* Desktop: sticky sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            {label}
          </h2>
          {tocList}
        </div>
      </aside>

      {/* Mobile: collapsible toggle above article */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-toc"
          className="flex items-center gap-2 text-sm font-medium text-spark-blue hover:text-spark-blue-dark transition-colors focus:outline-none focus:ring-2 focus:ring-spark-blue rounded px-2 py-1"
        >
          <svg
            className={`w-4 h-4 transition-transform ${mobileOpen ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {label}
        </button>
        {mobileOpen && (
          <div
            id="mobile-toc"
            className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            {tocList}
          </div>
        )}
      </div>
    </>
  );
}
