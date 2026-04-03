import { defineArrayMember, defineField, defineType } from "sanity";
import { languageField } from "./fields/language";
import { isUniquePerLanguage } from "./fields/isUniquePerLanguage";

export const faq = defineType({
  name: "faq",
  type: "document",
  title: "FAQ",
  icon: () => "❓",
  fields: [
    defineField({
      name: "question",
      type: "string",
      title: "Question",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      title: "Slug",
      description: "URL-friendly identifier. Auto-generated from question.",
      options: { source: "question", maxLength: 96, isUnique: isUniquePerLanguage },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "answer",
      type: "array",
      title: "Answer",
      of: [
        defineArrayMember({
          type: "block",
          styles: [{ title: "Normal", value: "normal" }],
          lists: [
            { title: "Bullet", value: "bullet" },
            { title: "Numbered", value: "number" },
          ],
          marks: {
            decorators: [
              { title: "Strong", value: "strong" },
              { title: "Emphasis", value: "em" },
              { title: "Code", value: "code" },
            ],
            annotations: [
              {
                name: "link",
                type: "object",
                title: "External Link",
                icon: () => "🔗",
                fields: [
                  defineField({
                    name: "href",
                    type: "url",
                    title: "URL",
                    validation: (Rule) =>
                      Rule.uri({ scheme: ["http", "https", "mailto", "tel"] }),
                  }),
                ],
              },
            ],
          },
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),

    // ── i18n ───────────────────────────────────────────────────
    languageField,
  ],
  preview: {
    select: { title: "question" },
    prepare({ title }) {
      return { title: title ?? "Untitled question" };
    },
  },
});
