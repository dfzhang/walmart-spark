"use client";

import { useState } from "react";
import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";

interface FaqItem {
  question: string;
  answer: PortableTextBlock[];
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="my-6 space-y-2">
      {items.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-lg">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full text-left px-4 py-3 font-medium flex justify-between items-center hover:bg-gray-50"
          >
            {item.question}
            <span className="text-gray-400 ml-2">{open === i ? "−" : "+"}</span>
          </button>
          {open === i && (
            <div className="px-4 pb-3 text-sm text-gray-600 prose prose-sm max-w-none">
              <PortableText value={item.answer} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
