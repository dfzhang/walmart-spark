import { defineArrayMember, defineField, defineType } from "sanity";

export const faqSection = defineType({
  name: "faqSection",
  type: "object",
  title: "FAQ Section",
  icon: () => "❓",
  fields: [
    defineField({
      name: "items",
      type: "array",
      title: "Questions & Answers",
      of: [
        defineArrayMember({
          type: "object",
          name: "faqItem",
          title: "FAQ Item",
          fields: [
            defineField({
              name: "question",
              type: "string",
              title: "Question",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "answer",
              type: "array",
              title: "Answer",
              of: [{ type: "block" }],
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: { title: "question" },
            prepare({ title }) {
              return { title: title ?? "Untitled question" };
            },
          },
        }),
      ],
      validation: (Rule) => Rule.min(1).error("Add at least one FAQ item."),
    }),
  ],
  preview: {
    select: { items: "items" },
    prepare({ items }) {
      const count = items?.length ?? 0;
      return {
        title: `FAQ Section — ${count} question${count === 1 ? "" : "s"}`,
      };
    },
  },
});
