import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryBySlug, getAllCategories } from "@/lib/sanity";
import { Breadcrumbs } from "@/components/breadcrumbs";
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
  const categories = await getAllCategories();
  return categories.map((c: { slug: { current: string } }) => ({
    slug: c.slug.current,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = (await getCategoryBySlug(slug)) as CategoryWithArticles | null;
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
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = (await getCategoryBySlug(slug)) as CategoryWithArticles | null;
  if (!category) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: category.title }]} />

      <h1 className="text-2xl font-bold mt-4 mb-2">{category.title}</h1>
      {category.description && (
        <p className="text-gray-600 mb-6">{category.description}</p>
      )}

      <div className="space-y-3">
        {category.articles.map((article) => (
          <a
            key={article._id}
            href={`/article/${article.slug.current}`}
            className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-[#0071DC] hover:shadow-sm transition-all"
          >
            <h3 className="font-medium text-[#0071DC]">{article.title}</h3>
            {article.excerpt && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{article.excerpt}</p>
            )}
          </a>
        ))}
      </div>

      {category.articles.length === 0 && (
        <p className="text-gray-500 text-center py-8">No articles in this category yet.</p>
      )}
    </div>
  );
}
