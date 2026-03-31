"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import { FaqAccordion } from "./faq-accordion";
import { urlForImage } from "@/lib/sanity";
import { slugify } from "@/lib/slugify";
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

function buildComponents(locale: Locale, slugCounterRef: React.RefObject<Map<string, number>>) {
  function articlePath(slug: string): string {
    return locale === "en" ? `/article/${slug}` : `/${locale}/article/${slug}`;
  }

  return {
    block: {
      h2: ({ children, value }: { children?: React.ReactNode; value: PortableTextBlock }) => {
        const id = getHeadingId(value, slugCounterRef);
        return <h2 id={id} className={HEADING_STYLES.h2}>{children}</h2>;
      },
      h3: ({ children, value }: { children?: React.ReactNode; value: PortableTextBlock }) => {
        const id = getHeadingId(value, slugCounterRef);
        return <h3 id={id} className={HEADING_STYLES.h3}>{children}</h3>;
      },
      h4: ({ children, value }: { children?: React.ReactNode; value: PortableTextBlock }) => {
        const id = getHeadingId(value, slugCounterRef);
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

/**
 * Extract plain text from a block and generate a slug ID.
 * Tracks seen slugs via ref to handle duplicates consistently
 * with the server-side extractHeadings() function.
 */
function getHeadingId(
  block: PortableTextBlock,
  counterRef: React.RefObject<Map<string, number>>
): string {
  const children = (block as { children?: { text?: string }[] }).children;
  const text = children ? children.map((c) => c.text ?? "").join("") : "";
  let id = slugify(text);

  const seen = counterRef.current;
  const count = seen.get(id) ?? 0;
  seen.set(id, count + 1);
  if (count > 0) {
    id = `${id}-${count}`;
  }

  return id;
}

export function ArticleBody({
  body,
  locale = "en",
}: {
  body: PortableTextBlock[];
  locale?: Locale;
}) {
  // Track duplicate heading slugs across the render — must match
  // the server-side extractHeadings() duplicate counter logic.
  const slugCounterRef = useRef(new Map<string, number>());

  // Reset on each render so re-renders produce consistent IDs
  slugCounterRef.current.clear();

  if (!body) return null;
  return <PortableText value={body} components={buildComponents(locale, slugCounterRef)} />;
}
