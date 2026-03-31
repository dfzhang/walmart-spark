"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative max-w-xl mx-auto">
      <label htmlFor="search-input" className="sr-only">
        Search for articles
      </label>
      <input
        id="search-input"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for articles..."
        className="w-full rounded-full px-5 py-3 text-gray-900 shadow-lg focus:outline-none focus:ring-2 focus:ring-spark-yellow"
        autoComplete="off"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-spark-yellow text-gray-900 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-spark-yellow-dark transition-colors focus:outline-none focus:ring-2 focus:ring-spark-blue focus:ring-offset-2"
      >
        Search
      </button>
    </form>
  );
}
