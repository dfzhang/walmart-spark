import Link from "next/link";
import type { ArticleSummary } from "@/lib/types";

interface FeaturedArticle extends ArticleSummary {
  category?: { title: string; slug: { current: string } };
}

export function FeaturedArticles({ articles }: { articles: FeaturedArticle[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {articles.map((article) => (
        <Link
          key={article._id}
          href={`/article/${article.slug.current}`}
          className="bg-spark-yellow/10 border border-spark-yellow/30 rounded-lg p-4 hover:bg-spark-yellow/20 transition-colors focus:outline-none focus:ring-2 focus:ring-spark-blue focus:ring-offset-2"
        >
          <h3 className="font-medium text-sm">{article.title}</h3>
          {article.category && (
            <span className="text-xs text-gray-500 mt-1 block">{article.category.title}</span>
          )}
        </Link>
      ))}
    </div>
  );
}
