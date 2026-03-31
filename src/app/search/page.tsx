import type { Metadata } from "next";
import Link from "next/link";
import { searchArticles } from "@/lib/sanity";
import { SearchBar } from "@/components/search-bar";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Search | Spark Driver™ Help Center",
  description: "Search the Spark Driver Help Center for answers to your questions.",
};

interface SearchResult {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt?: string;
  category?: { title: string; slug: { current: string } };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() || "";
  const results = query
    ? ((await searchArticles(query)) as SearchResult[])
    : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Search</h1>
      <SearchBar defaultValue={query} />

      {query && (
        <p className="text-sm text-gray-500 mt-4 mb-6">
          {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
        </p>
      )}

      <div className="space-y-3 mt-4">
        {results.map((r) => (
          <Link
            key={r._id}
            href={`/article/${r.slug.current}`}
            className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-spark-blue hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-spark-blue focus:ring-offset-2 rounded-lg"
          >
            <h3 className="font-medium text-spark-blue">{r.title}</h3>
            {r.category && (
              <span className="text-xs text-gray-400">{r.category.title}</span>
            )}
            {r.excerpt && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{r.excerpt}</p>
            )}
          </Link>
        ))}
      </div>

      {query && results.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No results found. Try different keywords.
        </p>
      )}
    </div>
  );
}
