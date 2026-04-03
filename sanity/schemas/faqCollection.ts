import { defineArrayMember, defineField, defineType } from "sanity";
import { languageField } from "./fields/language";
import { isUniquePerLanguage } from "./fields/isUniquePerLanguage";

export const faqCollection = defineType({
  name: "faqCollection",
  type: "document",
  title: "FAQ Collection",
  icon: () => "📋",
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      description: 'Name of this FAQ group (e.g. "Earnings FAQs").',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      title: "Slug",
      description: "URL-friendly identifier. Auto-generated from title.",
      options: { source: "title", maxLength: 96, isUnique: isUniquePerLanguage },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "items",
      type: "array",
      title: "FAQ Items",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "faq" }],
        }),
      ],
      validation: (Rule) => Rule.min(1).error("Add at least one FAQ item."),
    }),

    // ── i18n ───────────────────────────────────────────────────
    languageField,
  ],
  preview: {
    select: { title: "title", items: "items" },
    prepare({ title, items }) {
      const count = items?.length ?? 0;
      return {
        title: title ?? "Untitled collection",
        subtitle: `${count} question${count === 1 ? "" : "s"}`,
      };
    },
  },
});
