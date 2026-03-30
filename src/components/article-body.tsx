"use client";

import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import { FaqAccordion } from "./faq-accordion";

const components = {
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
  },
  marks: {
    link: ({ children, value }: { children: React.ReactNode; value?: { href: string } }) => (
      <a href={value?.href} className="text-[#0071DC] underline hover:text-[#004F9A]" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
  },
};

export function ArticleBody({ body }: { body: PortableTextBlock[] }) {
  if (!body) return null;
  return <PortableText value={body} components={components} />;
}
