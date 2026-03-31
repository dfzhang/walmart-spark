"use client";

import { useState, useId } from "react";
import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";

interface FaqItem {
  question: string;
  answer: PortableTextBlock[];
}

function AccordionItem({
  item,
  isOpen,
  onToggle,
  index,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}) {
  const baseId = useId();
  const triggerId = `${baseId}-trigger-${index}`;
  const panelId = `${baseId}-panel-${index}`;

  return (
    <div className="border border-gray-200 rounded-lg">
      <h3>
        <button
          id={triggerId}
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="w-full text-left px-4 py-3 font-medium flex justify-between items-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-spark-blue focus:ring-inset rounded-lg"
        >
          {item.question}
          <span className="text-gray-400 ml-2" aria-hidden="true">
            {isOpen ? "−" : "+"}
          </span>
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        hidden={!isOpen}
        className="px-4 pb-3 text-sm text-gray-600 prose prose-sm max-w-none"
      >
        <PortableText value={item.answer} />
      </div>
    </div>
  );
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="my-6 space-y-2">
      {items.map((item, i) => (
        <AccordionItem
          key={i}
          item={item}
          index={i}
          isOpen={open === i}
          onToggle={() => setOpen(open === i ? null : i)}
        />
      ))}
    </div>
  );
}
