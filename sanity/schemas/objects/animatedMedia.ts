import { defineField, defineType } from "sanity";

/**
 * Portable Text block type for embedding animated assets in article body.
 * References an `animatedAsset` document — editors upload once, embed many times.
 */
export const animatedMedia = defineType({
  name: "animatedMedia",
  type: "object",
  title: "Animated Media",
  icon: () => "🎬",
  fields: [
    defineField({
      name: "animation",
      type: "reference",
      title: "Animation",
      description: "Select an animated asset from the library.",
      to: [{ type: "animatedAsset" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "caption",
      type: "string",
      title: "Caption",
    }),
    defineField({
      name: "altText",
      type: "string",
      title: "Alt Text Override",
      description:
        "Override the default alt text for this specific usage. Falls back to the asset's alt text if empty.",
    }),
  ],
  preview: {
    select: {
      assetTitle: "animation.title",
      caption: "caption",
    },
    prepare({ assetTitle, caption }) {
      return {
        title: caption || assetTitle || "Lottie Animation",
        subtitle: caption ? assetTitle : undefined,
        media: () => "🎬",
      };
    },
  },
});
