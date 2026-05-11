import { defineField, defineType } from "sanity";
import { LottieFilePreview } from "../components/LottieFilePreview";

export const animatedAsset = defineType({
  name: "animatedAsset",
  type: "document",
  title: "Animated Asset",
  icon: () => "🎬",
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      title: "Description",
      rows: 3,
    }),
    defineField({
      name: "lottieFile",
      type: "file",
      title: "Lottie Animation File",
      description: "Upload a Lottie JSON file (.json).",
      options: { accept: ".json" },
      validation: (Rule) => Rule.required(),
      components: { input: LottieFilePreview },
    }),
    defineField({
      name: "autoplay",
      type: "boolean",
      title: "Autoplay",
      description: "Start playing automatically when visible.",
      initialValue: true,
    }),
    defineField({
      name: "loop",
      type: "boolean",
      title: "Loop",
      description: "Repeat the animation continuously.",
      initialValue: true,
    }),
    defineField({
      name: "altText",
      type: "string",
      title: "Alt Text",
      description: "Describe the animation for screen readers.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "tags",
      type: "array",
      title: "Tags",
      description: "Tags for filtering and search.",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
  ],
  preview: {
    select: { title: "title", description: "description" },
    prepare({ title, description }) {
      return {
        title: title || "Untitled Animation",
        subtitle: description || "",
        media: () => "🎬",
      };
    },
  },
});
