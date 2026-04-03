import { defineField, defineType } from "sanity";

/**
 * Portable Text block type that embeds a reference to a faqCollection.
 *
 * Bare references can't go directly in PT `of` arrays — they need to be
 * wrapped in a named object type. This is that wrapper.
 */
export const faqCollectionRef = defineType({
  name: "faqCollectionRef",
  type: "object",
  title: "FAQ Collection",
  icon: () => "📋",
  fields: [
    defineField({
      name: "collection",
      type: "reference",
      title: "FAQ Collection",
      to: [{ type: "faqCollection" }],
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { title: "collection.title", items: "collection.items" },
    prepare({ title, items }) {
      const count = items?.length ?? 0;
      return {
        title: title ? `FAQ: ${title}` : "FAQ Collection (unlinked)",
        subtitle: count ? `${count} question${count === 1 ? "" : "s"}` : "",
      };
    },
  },
});
