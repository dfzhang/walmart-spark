import { defineArrayMember, defineField, defineType } from "sanity";
import {
  orderRankField,
  orderRankOrdering,
} from "@sanity/orderable-document-list";
import { languageField } from "./fields/language";
import { isUniquePerLanguage } from "./fields/isUniquePerLanguage";
import { styleGuideRules } from "../validation/styleGuideValidation";

export const article = defineType({
  name: "article",
  type: "document",
  title: "Article",
  icon: () => "📄",
  orderings: [orderRankOrdering],
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "metadata", title: "Metadata" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    // ── Content group ──────────────────────────────────────────
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      group: "content",
      validation: (Rule) => [
        Rule.required().max(100),
        ...styleGuideRules(Rule, "string"),
      ],
    }),
    defineField({
      name: "slug",
      type: "slug",
      title: "Slug",
      group: "content",
      options: { source: "title", maxLength: 96, isUnique: isUniquePerLanguage },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "excerpt",
      type: "text",
      title: "Excerpt",
      description: "Brief summary for listings and search results.",
      group: "content",
      rows: 3,
      validation: (Rule) => [
        Rule.max(200).warning("Keep under 200 characters for card display."),
        ...styleGuideRules(Rule, "text"),
      ],
    }),
    defineField({
      name: "body",
      type: "array",
      title: "Body",
      group: "content",
      validation: (Rule) => [...styleGuideRules(Rule, "pt")],
      of: [
        // Rich text blocks
        defineArrayMember({
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "H2", value: "h2" },
            { title: "H3", value: "h3" },
            { title: "H4", value: "h4" },
            { title: "Quote", value: "blockquote" },
          ],
          lists: [
            { title: "Bullet", value: "bullet" },
            { title: "Numbered", value: "number" },
          ],
          marks: {
            decorators: [
              { title: "Strong", value: "strong" },
              { title: "Emphasis", value: "em" },
              { title: "Code", value: "code" },
              { title: "Underline", value: "underline" },
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
                      Rule.uri({
                        scheme: ["http", "https", "mailto", "tel"],
                      }),
                  }),
                  defineField({
                    name: "openInNewTab",
                    type: "boolean",
                    title: "Open in new tab",
                    initialValue: true,
                  }),
                ],
              },
              {
                name: "internalLink",
                type: "object",
                title: "Internal Link",
                icon: () => "📎",
                fields: [
                  defineField({
                    name: "reference",
                    type: "reference",
                    title: "Reference",
                    to: [{ type: "article" }, { type: "category" }],
                  }),
                ],
              },
            ],
          },
        }),
        // Embedded images
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              type: "string",
              title: "Alt Text",
              description: "Required for accessibility.",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "caption",
              type: "string",
              title: "Caption",
            }),
          ],
        }),
        // Custom block types
        defineArrayMember({ type: "animatedMedia" }),
        defineArrayMember({ type: "callout" }),
        defineArrayMember({ type: "faqSection" }),
        defineArrayMember({ type: "faqCollectionRef" }),
        defineArrayMember({ type: "codeBlock" }),
      ],
    }),

    // ── Metadata group ─────────────────────────────────────────
    defineField({
      name: "category",
      type: "reference",
      title: "Category",
      group: "metadata",
      to: [{ type: "category" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "relatedArticles",
      type: "array",
      title: "Related Articles",
      description: "Up to 5 related articles shown at the bottom of the page.",
      group: "metadata",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "article" }],
        }),
      ],
      validation: (Rule) => Rule.max(5).unique(),
    }),
    defineField({
      name: "featured",
      type: "boolean",
      title: "Featured Article",
      description: "Show this article prominently on the homepage.",
      group: "metadata",
      initialValue: false,
    }),
    defineField({
      name: "legalReviewNeeded",
      type: "boolean",
      title: "Legal Review Needed",
      description:
        "When enabled, this article requires legal approval before publishing.",
      group: "metadata",
      initialValue: false,
    }),
    defineField({
      name: "approvalLog",
      type: "array",
      title: "Approval Log",
      group: "metadata",
      hidden: true,
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "stage",
              type: "string",
              title: "Stage",
            }),
            defineField({
              name: "action",
              type: "string",
              title: "Action",
            }),
            defineField({
              name: "userId",
              type: "string",
              title: "User ID",
            }),
            defineField({
              name: "userName",
              type: "string",
              title: "User Name",
            }),
            defineField({
              name: "timestamp",
              type: "datetime",
              title: "Timestamp",
            }),
            defineField({
              name: "comment",
              type: "text",
              title: "Comment",
            }),
            defineField({
              name: "documentRevision",
              type: "string",
              title: "Document Revision",
            }),
            defineField({
              name: "documentId",
              type: "string",
              title: "Document ID",
              description:
                "The _id (may be drafts.xxx) of the document at the time of this action. Used to fetch the correct revision from the History API.",
            }),
          ],
        }),
      ],
    }),
    orderRankField({ type: "article" }),

    // ── SEO group ──────────────────────────────────────────────
    defineField({
      name: "seo",
      type: "seo",
      title: "SEO Settings",
      group: "seo",
    }),

    // ── i18n ───────────────────────────────────────────────────
    languageField,
  ],
  preview: {
    select: {
      title: "title",
      category: "category.title",
      featured: "featured",
    },
    prepare({ title, category, featured }) {
      return {
        title: featured ? `⭐ ${title}` : title,
        subtitle: category ?? "No category",
      };
    },
  },
});
