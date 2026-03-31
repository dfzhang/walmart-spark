import Link from "next/link";
import type { ArticleSummary } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export function RelatedArticles({
  articles,
  locale = "en",
}: {
  articles: ArticleSummary[];
  locale?: Locale;
}) {
  const dict = getDictionary(locale);

  return (
    <section className="mt-10 pt-6 border-t border-gray-200" aria-labelledby="related-heading">
      <h2 id="related-heading" className="font-semibold mb-3">
        {dict.article.relatedArticles}
      </h2>
      <div className="space-y-2">
        {articles.map((a) => {
          const href = locale === "en"
            ? `/article/${a.slug.current}`
            : `/${locale}/article/${a.slug.current}`;
          return (
            <Link
              key={a._id}
              href={href}
              className="block text-spark-blue hover:underline text-sm focus:outline-none focus:ring-2 focus:ring-spark-blue rounded px-0.5"
            >
              {a.title}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
