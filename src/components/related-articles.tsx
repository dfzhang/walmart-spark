import type { ArticleSummary } from "@/lib/types";

export function RelatedArticles({ articles }: { articles: ArticleSummary[] }) {
  return (
    <section className="mt-10 pt-6 border-t border-gray-200">
      <h2 className="font-semibold mb-3">Related Articles</h2>
      <div className="space-y-2">
        {articles.map((a) => (
          <a
            key={a._id}
            href={`/article/${a.slug.current}`}
            className="block text-[#0071DC] hover:underline text-sm"
          >
            {a.title}
          </a>
        ))}
      </div>
    </section>
  );
}
