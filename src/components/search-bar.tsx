"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export function SearchBar({
  defaultValue = "",
  locale = "en",
}: {
  defaultValue?: string;
  locale?: Locale;
}) {
  const dict = getDictionary(locale);
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  const searchPath = locale === "en" ? "/search" : `/${locale}/search`;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`${searchPath}?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative max-w-xl mx-auto">
      <label htmlFor="search-input" className="sr-only">
        {dict.search.placeholder}
      </label>
      <input
        id="search-input"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={dict.search.placeholder}
        className="w-full rounded-full px-5 py-3 text-gray-900 shadow-lg focus:outline-none focus:ring-2 focus:ring-spark-yellow"
        autoComplete="off"
      />
      <button
        type="submit"
        aria-label={dict.search.button}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-spark-yellow text-gray-900 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-spark-yellow-dark transition-colors focus:outline-none focus:ring-2 focus:ring-spark-blue focus:ring-offset-2"
      >
        {dict.search.button}
      </button>
    </form>
  );
}
