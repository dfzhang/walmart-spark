import type { Metadata } from "next";
import Link from "next/link";
import { searchArticles } from "@/lib/sanity";
import { SearchBar } from "@/components/search-bar";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath } from "@/lib/i18n/config";

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
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = (isValidLocale(localeParam) ? localeParam : "en") as Locale;
  const dict = getDictionary(locale);

  const { q } = await searchParams;
  const query = q?.trim() || "";
  const results = query
    ? ((await searchArticles(query)) as SearchResult[])
    : [];

  const plural = results.length !== 1 ? "s" : "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">{dict.search.title}</h1>
      <SearchBar defaultValue={query} locale={locale} />

      {query && (
        <p className="text-sm text-gray-500 mt-4 mb-6">
          {dict.search.resultsCount
            .replace("{count}", String(results.length))
            .replace("{plural}", plural)
            .replace("{query}", query)}
        </p>
      )}

      <div className="space-y-3 mt-4">
        {results.map((r) => (
          <Link
            key={r._id}
            href={localePath(locale, `/article/${r.slug.current}`)}
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
          {dict.search.noResults}
        </p>
      )}
    </div>
  );
}
