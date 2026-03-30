import { notFound } from "next/navigation";
import { getArticleBySlug } from "@/lib/sanity";
import type { Article } from "@/lib/types";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ArticleBody } from "@/components/article-body";
import { RelatedArticles } from "@/components/related-articles";
import { FeedbackWidget } from "@/components/feedback-widget";

export const revalidate = 60;

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = (await getArticleBySlug(slug)) as Article | null;
  if (!article) notFound();

  const breadcrumbs = [
    { label: "Home", href: "/" },
    ...(article.category
      ? [{ label: article.category.title, href: `/category/${article.category.slug.current}` }]
      : []),
    { label: article.title },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={breadcrumbs} />

      <article className="mt-6">
        <h1 className="text-2xl font-bold mb-2">{article.title}</h1>
        {article._updatedAt && (
          <p className="text-sm text-gray-400 mb-6">
            Last updated: {new Date(article._updatedAt).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        )}

        <div className="prose prose-blue max-w-none">
          <ArticleBody body={article.body} />
        </div>
      </article>

      <FeedbackWidget articleId={article._id} />

      {article.relatedArticles && article.relatedArticles.length > 0 && (
        <RelatedArticles articles={article.relatedArticles} />
      )}
    </div>
  );
}
