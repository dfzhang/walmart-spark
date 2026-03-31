import { defineArrayMember, defineField, defineType } from "sanity";
import { languageField } from "./fields/language";

export const helpCenterSettings = defineType({
  name: "helpCenterSettings",
  type: "document",
  title: "Help Center Settings",
  icon: () => "⚙️",
  fields: [
    defineField({
      name: "siteName",
      type: "string",
      title: "Site Name",
      description: "Displayed in the header and browser tab.",
      initialValue: "Spark Driver™ Help Center",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "logo",
      type: "image",
      title: "Logo",
      description: "Site logo displayed in the header.",
      options: { hotspot: true },
    }),
    defineField({
      name: "contactEmail",
      type: "string",
      title: "Contact Email",
      description: "Email address for the contact form.",
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: "supportUrl",
      type: "url",
      title: "Support URL",
      description: "Link to external support portal (if any).",
    }),
    defineField({
      name: "searchPlaceholder",
      type: "string",
      title: "Search Placeholder Text",
      description: "Placeholder shown in the search bar.",
      initialValue: "How can we help?",
    }),
    defineField({
      name: "featuredArticlesCount",
      type: "number",
      title: "Featured Articles to Display",
      description: "How many featured articles to show on the homepage.",
      initialValue: 3,
      validation: (Rule) => Rule.integer().positive().max(10),
    }),
    defineField({
      name: "footerLinks",
      type: "array",
      title: "Footer Links",
      of: [
        defineArrayMember({
          type: "object",
          name: "footerLink",
          fields: [
            defineField({
              name: "label",
              type: "string",
              title: "Label",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "url",
              type: "url",
              title: "URL",
              validation: (Rule) =>
                Rule.required().uri({ scheme: ["http", "https", "mailto"] }),
            }),
          ],
          preview: {
            select: { title: "label", subtitle: "url" },
          },
        }),
      ],
    }),

    // ── i18n ───────────────────────────────────────────────────
    languageField,
  ],
  // Singleton: only one instance should exist.
  // Enforce via desk structure (see deskStructure.ts).
});
