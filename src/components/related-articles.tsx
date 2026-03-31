import Link from "next/link";
import type { ArticleSummary } from "@/lib/types";

export function RelatedArticles({ articles }: { articles: ArticleSummary[] }) {
  return (
    <section className="mt-10 pt-6 border-t border-gray-200" aria-labelledby="related-heading">
      <h2 id="related-heading" className="font-semibold mb-3">Related Articles</h2>
      <div className="space-y-2">
        {articles.map((a) => (
          <Link
            key={a._id}
            href={`/article/${a.slug.current}`}
            className="block text-[#0071DC] hover:underline text-sm focus:outline-none focus:ring-2 focus:ring-[#0071DC] rounded px-0.5"
          >
            {a.title}
          </Link>
        ))}
      </div>
    </section>
  );
}
