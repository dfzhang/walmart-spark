import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getCategoryBySlug, getCategoryBySlugForMetadata, getAllCategorySlugs } from "@/lib/sanity";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { isValidLocale, localePath, buildHreflangAlternates, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { ArticleSummary, SeoFields } from "@/lib/types";

export const revalidate = 60;

interface CategoryWithArticles {
  _id: string;
  title: string;
  slug: { current: string };
  description?: string;
  articles: ArticleSummary[];
  seo?: SeoFields;
}

export async function generateStaticParams() {
  const categories = await getAllCategorySlugs();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale: localeParam } = await params;
  const metaLocale = localeParam === "es" ? "es" as const : "en" as const;
  const category = (await getCategoryBySlugForMetadata(slug, metaLocale)) as CategoryWithArticles | null;
  if (!category) return {};

  const title = category.seo?.metaTitle || category.title;
  const description =
    category.seo?.metaDescription ||
    category.description ||
    `Browse ${category.title} help articles`;

  return {
    title: `${title} | Spark Driver™ Help Center`,
    description,
    openGraph: {
      title,
      description,
    },
    alternates: {
      languages: buildHreflangAlternates(`/category/${slug}`),
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale: localeParam } = await params;
  const locale = (isValidLocale(localeParam) ? localeParam : "en") as Locale;
  const dict = getDictionary(locale);

  const category = (await getCategoryBySlug(slug, locale)) as CategoryWithArticles | null;
  if (!category) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumbs items={[
        { label: dict.breadcrumb.home, href: localePath(locale, "/") },
        { label: category.title },
      ]} />

      <h1 className="text-2xl font-bold mt-4 mb-2">{category.title}</h1>
      {category.description && (
        <p className="text-gray-600 mb-6">{category.description}</p>
      )}

      <div className="space-y-3">
        {category.articles.map((article) => (
          <Link
            key={article._id}
            href={localePath(locale, `/article/${article.slug.current}`)}
            className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-spark-blue hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-spark-blue focus:ring-offset-2 rounded-lg"
          >
            <h3 className="font-medium text-spark-blue">{article.title}</h3>
            {article.excerpt && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{article.excerpt}</p>
            )}
          </Link>
        ))}
      </div>

      {category.articles.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          {locale === "es" ? "No hay artículos en esta categoría todavía." : "No articles in this category yet."}
        </p>
      )}
    </div>
  );
}
