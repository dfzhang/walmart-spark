import type { Category } from "@/lib/types";

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

export function CategoryCard({ category }: { category: Category }) {
  const icon = category.icon || iconMap[category.title] || "📄";

  return (
    <a
      href={`/category/${category.slug.current}`}
      className="bg-white rounded-lg border border-gray-200 p-5 hover:border-[#0071DC] hover:shadow-md transition-all group"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="font-semibold group-hover:text-[#0071DC] transition-colors">
        {category.title}
      </h3>
      <p className="text-sm text-gray-500 mt-1">
        {category.articleCount} article{category.articleCount !== 1 ? "s" : ""}
      </p>
    </a>
  );
}
