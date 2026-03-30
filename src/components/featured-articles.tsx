import type { ArticleSummary } from "@/lib/types";

interface FeaturedArticle extends ArticleSummary {
  category?: { title: string; slug: { current: string } };
}

export function FeaturedArticles({ articles }: { articles: FeaturedArticle[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {articles.map((article) => (
        <a
          key={article._id}
          href={`/article/${article.slug.current}`}
          className="bg-[#FFC220]/10 border border-[#FFC220]/30 rounded-lg p-4 hover:bg-[#FFC220]/20 transition-colors"
        >
          <h3 className="font-medium text-sm">{article.title}</h3>
          {article.category && (
            <span className="text-xs text-gray-500 mt-1 block">{article.category.title}</span>
          )}
        </a>
      ))}
    </div>
  );
}
