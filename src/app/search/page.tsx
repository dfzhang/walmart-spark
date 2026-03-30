import { searchArticles } from "@/lib/sanity";
import { SearchBar } from "@/components/search-bar";

export const revalidate = 0;

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
          <a
            key={r._id}
            href={`/article/${r.slug.current}`}
            className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-[#0071DC] hover:shadow-sm transition-all"
          >
            <h3 className="font-medium text-[#0071DC]">{r.title}</h3>
            {r.category && (
              <span className="text-xs text-gray-400">{r.category.title}</span>
            )}
            {r.excerpt && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{r.excerpt}</p>
            )}
          </a>
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
