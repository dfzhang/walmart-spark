import Link from "next/link";
import type { Category } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

const iconMap: Record<string, string> = {
  "Getting Started": "🚀",
  "Earnings": "💰",
  "Using the App": "📱",
  "Arrival & Pick Up": "📦",
  "Delivery": "🚗",
  "Shopping & Delivery": "🛒",
  "Returns": "↩️",
  "Troubleshooting": "🔧",
  "FAQs": "❓",
  "Additional Resources": "📚",
};

export function CategoryCard({
  category,
  locale = "en",
}: {
  category: Category;
  locale?: Locale;
}) {
  const dict = getDictionary(locale);
  const icon = category.icon || iconMap[category.title] || "📄";
  const href = locale === "en"
    ? `/category/${category.slug.current}`
    : `/${locale}/category/${category.slug.current}`;

  const plural = category.articleCount !== 1 ? "s" : "";

  return (
    <Link
      href={href}
      className="bg-white rounded-lg border border-gray-200 p-5 hover:border-spark-blue hover:shadow-md transition-all group focus:outline-none focus:ring-2 focus:ring-spark-blue focus:ring-offset-2"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="font-semibold group-hover:text-spark-blue transition-colors">
        {category.title}
      </h3>
      <p className="text-sm text-gray-500 mt-1">
        {dict.categories.articlesCount
          .replace("{count}", String(category.articleCount))
          .replace("{plural}", plural)}
      </p>
    </Link>
  );
}
