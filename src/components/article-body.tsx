"use client";

import Image from "next/image";
import Link from "next/link";
import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import { FaqAccordion } from "./faq-accordion";
import { urlForImage } from "@/lib/sanity";
import type { Locale } from "@/lib/i18n/config";

const LANGUAGE_LABELS: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  json: "JSON",
  html: "HTML",
  css: "CSS",
  bash: "Bash",
  text: "Plain Text",
};

const HEADING_STYLES: Record<string, string> = {
  h2: "text-xl font-bold mt-8 mb-3",
  h3: "text-lg font-semibold mt-6 mb-2",
  h4: "text-base font-semibold mt-4 mb-2",
};

function buildComponents(locale: Locale, headingIds: Record<string, string>) {
  function articlePath(slug: string): string {
    return locale === "en" ? `/article/${slug}` : `/${locale}/article/${slug}`;
  }

  return {
    block: {
      h2: ({ children, value }: { children?: React.ReactNode; value: PortableTextBlock }) => {
        const id = value._key ? headingIds[value._key] ?? "" : "";
        return <h2 id={id} className={HEADING_STYLES.h2}>{children}</h2>;
      },
      h3: ({ children, value }: { children?: React.ReactNode; value: PortableTextBlock }) => {
        const id = value._key ? headingIds[value._key] ?? "" : "";
        return <h3 id={id} className={HEADING_STYLES.h3}>{children}</h3>;
      },
      h4: ({ children, value }: { children?: React.ReactNode; value: PortableTextBlock }) => {
        const id = value._key ? headingIds[value._key] ?? "" : "";
        return <h4 id={id} className={HEADING_STYLES.h4}>{children}</h4>;
      },
    },
    types: {
      callout: ({ value }: { value: { style: string; content: PortableTextBlock[] } }) => {
        const styles: Record<string, string> = {
          info: "bg-blue-50 border-blue-200 text-blue-800",
          warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
          tip: "bg-green-50 border-green-200 text-green-800",
        };
        const icons: Record<string, string> = { info: "ℹ️", warning: "⚠️", tip: "💡" };
        const style = value.style || "info";
        return (
          <div className={`border rounded-lg p-4 my-4 ${styles[style] || styles.info}`}>
            <span className="mr-2">{icons[style] || icons.info}</span>
            <PortableText value={value.content} />
          </div>
        );
      },
      faqSection: ({ value }: { value: { items: { question: string; answer: PortableTextBlock[] }[] } }) => (
        <FaqAccordion items={value.items || []} />
      ),
      codeBlock: ({ value }: { value: { language?: string; code: string } }) => {
        const lang = value.language || "text";
        const label = LANGUAGE_LABELS[lang] || lang;
        return (
          <div className="my-4 rounded-lg overflow-hidden border border-gray-200">
            <div className="bg-gray-800 text-gray-300 text-xs px-4 py-1.5 font-mono">
              {label}
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 overflow-x-auto text-sm leading-relaxed">
              <code>{value.code}</code>
            </pre>
          </div>
        );
      },
      image: ({ value }: { value: { asset: { _ref: string }; alt?: string; caption?: string } }) => {
        if (!value?.asset?._ref) return null;
        const url = urlForImage(value).width(800).auto("format").quality(80).url();
        return (
          <figure className="my-6">
            <Image
              src={url}
              alt={value.alt || ""}
              width={800}
              height={450}
              className="rounded-lg w-full h-auto"
              sizes="(max-width: 768px) 100vw, 800px"
            />
            {value.caption && (
              <figcaption className="text-sm text-gray-500 mt-2 text-center">
                {value.caption}
              </figcaption>
            )}
          </figure>
        );
      },
    },
    marks: {
      link: ({ children, value }: { children: React.ReactNode; value?: { href: string; openInNewTab?: boolean } }) => (
        <a
          href={value?.href}
          className="text-spark-blue underline hover:text-spark-blue-dark"
          target={value?.openInNewTab !== false ? "_blank" : undefined}
          rel={value?.openInNewTab !== false ? "noopener noreferrer" : undefined}
        >
          {children}
        </a>
      ),
      internalLink: ({ children, value }: { children: React.ReactNode; value?: { reference?: { _ref: string } } }) => {
        const ref = value?.reference?._ref || "";
        const slug = ref.replace(/^article-/, "");
        if (!slug) return <>{children}</>;
        return (
          <Link href={articlePath(slug)} className="text-spark-blue underline hover:text-spark-blue-dark">
            {children}
          </Link>
        );
      },
    },
  };
}

export function ArticleBody({
  body,
  locale = "en",
  headingIds = {},
}: {
  body: PortableTextBlock[];
  locale?: Locale;
  /** Server-computed heading ID map (block _key → slug ID).
   *  Single source of truth — eliminates hydration mismatch on duplicates. */
  headingIds?: Record<string, string>;
}) {
  if (!body) return null;
  return <PortableText value={body} components={buildComponents(locale, headingIds)} />;
}
