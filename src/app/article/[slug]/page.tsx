import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArticleBySlug } from "@/lib/sanity";
import type { Article } from "@/lib/types";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ArticleBody } from "@/components/article-body";
import { RelatedArticles } from "@/components/related-articles";
import { FeedbackWidget } from "@/components/feedback-widget";
import type { PortableTextBlock } from "@portabletext/types";

export const revalidate = 60;

interface FaqItem {
  question: string;
  answer: PortableTextBlock[];
}

interface FaqSection {
  _type: "faqSection";
  items: FaqItem[];
}

function extractFaqSections(body: PortableTextBlock[]): FaqSection[] {
  return (body ?? []).filter(
    (block) => (block as unknown as { _type: string })._type === "faqSection"
  ) as unknown as FaqSection[];
}

function portableTextToPlain(blocks: PortableTextBlock[]): string {
  return (blocks ?? [])
    .map((block) => {
      const children = (block as { children?: { text?: string }[] }).children;
      if (!children) return "";
      return children.map((c) => c.text ?? "").join("");
    })
    .join(" ")
    .trim();
}

function buildFaqJsonLd(faqSections: FaqSection[], articleTitle: string) {
  const questions = faqSections.flatMap((section) =>
    (section.items ?? []).map((item) => ({
      "@type": "Question" as const,
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: portableTextToPlain(item.answer),
      },
    }))
  );

  if (questions.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    name: articleTitle,
    mainEntity: questions,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = (await getArticleBySlug(slug)) as Article | null;
  if (!article) return {};

  const title = article.seo?.metaTitle || article.title;
  const description =
    article.seo?.metaDescription ||
    article.excerpt ||
    `Help article: ${article.title}`;

  return {
    title: `${title} | Spark Driver™ Help Center`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      modifiedTime: article._updatedAt,
    },
  };
}

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

  const faqSections = extractFaqSections(article.body);
  const faqJsonLd = buildFaqJsonLd(faqSections, article.title);

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

      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
    </div>
  );
}
