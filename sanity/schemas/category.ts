import { defineField, defineType } from "sanity";
import {
  orderRankField,
  orderRankOrdering,
} from "@sanity/orderable-document-list";

export const category = defineType({
  name: "category",
  type: "document",
  title: "Category",
  icon: () => "📂",
  orderings: [orderRankOrdering],
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      description: 'Category name shown to users (e.g. "Getting Started").',
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: "slug",
      type: "slug",
      title: "Slug",
      description: "URL-friendly identifier. Auto-generated from title.",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      title: "Description",
      description: "Short summary shown on the category card.",
      rows: 3,
      validation: (Rule) =>
        Rule.max(200).warning("Keep under 200 characters for card display."),
    }),
    defineField({
      name: "icon",
      type: "image",
      title: "Icon",
      description: "Category icon displayed on the homepage grid.",
      options: { hotspot: true },
    }),
    orderRankField({ type: "category" }),
    defineField({
      name: "seo",
      type: "seo",
      title: "SEO Settings",
    }),
  ],
  preview: {
    select: { title: "title", description: "description", media: "icon" },
    prepare({ title, description, media }) {
      return {
        title,
        subtitle: description ?? "No description",
        media,
      };
    },
  },
});
