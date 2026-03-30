import { defineField, defineType } from "sanity";

export const seo = defineType({
  name: "seo",
  type: "object",
  title: "SEO Settings",
  fields: [
    defineField({
      name: "metaTitle",
      type: "string",
      title: "Meta Title",
      description: "Overrides the default page title for search engines.",
      validation: (Rule) =>
        Rule.max(60).warning("Keep under 60 characters for best SEO results."),
    }),
    defineField({
      name: "metaDescription",
      type: "text",
      title: "Meta Description",
      rows: 3,
      description: "Overrides the default description for search engines.",
      validation: (Rule) =>
        Rule.max(160).warning(
          "Keep under 160 characters for best SEO results."
        ),
    }),
    defineField({
      name: "ogImage",
      type: "image",
      title: "Open Graph Image",
      description: "Image shown when shared on social media.",
      options: { hotspot: true },
    }),
  ],
  options: { collapsible: true, collapsed: true },
});
