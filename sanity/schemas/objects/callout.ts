import { defineField, defineType } from "sanity";

export const callout = defineType({
  name: "callout",
  type: "object",
  title: "Callout",
  icon: () => "💡",
  fields: [
    defineField({
      name: "style",
      type: "string",
      title: "Style",
      options: {
        list: [
          { title: "ℹ️ Info", value: "info" },
          { title: "⚠️ Warning", value: "warning" },
          { title: "💡 Tip", value: "tip" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "info",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "content",
      type: "array",
      title: "Content",
      of: [{ type: "block" }],
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { style: "style", content: "content" },
    prepare({ style, content }) {
      const label =
        style === "info" ? "ℹ️ Info" : style === "warning" ? "⚠️ Warning" : "💡 Tip";
      const text =
        content?.[0]?.children
          ?.map((c: { text?: string }) => c.text)
          .join("") ?? "";
      return { title: `${label}: ${text.substring(0, 60)}` };
    },
  },
});
