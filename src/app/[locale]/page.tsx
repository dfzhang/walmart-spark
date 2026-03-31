import type { Metadata } from "next";
import { getAllCategories, getFeaturedArticles, getHelpCenterSettings } from "@/lib/sanity";
import type { Category, ArticleSummary, HelpCenterSettings } from "@/lib/types";
import { SearchBar } from "@/components/search-bar";
import { CategoryCard } from "@/components/category-card";
import { FeaturedArticles } from "@/components/featured-articles";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath } from "@/lib/i18n/config";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Spark Driver™ Help Center — Find Answers to Your Questions",
  description:
    "Get help with your Spark Driver account, earnings, deliveries, and more. Browse articles or search for answers.",
  openGraph: {
    title: "Spark Driver™ Help Center",
    description: "Get help with your Spark Driver account, earnings, deliveries, and more.",
  },
};

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = (isValidLocale(localeParam) ? localeParam : "en") as Locale;
  const dict = getDictionary(locale);

  const [categories, featured, settings] = await Promise.all([
    getAllCategories() as Promise<Category[]>,
    getFeaturedArticles() as Promise<(ArticleSummary & { category?: { title: string; slug: { current: string } } })[]>,
    getHelpCenterSettings() as Promise<HelpCenterSettings | null>,
  ]);

  return (
    <>
      {/* Hero */}
      <section className="bg-spark-blue text-white pb-12 pt-8">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="text-3xl font-bold mb-2">
            {settings?.heroTitle || dict.hero.defaultTitle}
          </h1>
          <p className="text-blue-100 mb-6">
            {settings?.heroSubtitle || dict.hero.defaultSubtitle}
          </p>
          <SearchBar locale={locale} />
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Featured Articles */}
        {featured.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">{dict.featured.title}</h2>
            <FeaturedArticles articles={featured} locale={locale} />
          </section>
        )}

        {/* Categories */}
        <section>
          <h2 className="text-xl font-semibold mb-4">{dict.categories.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <CategoryCard key={cat._id} category={cat} locale={locale} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
