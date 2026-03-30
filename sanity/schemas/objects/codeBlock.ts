import { defineField, defineType } from "sanity";

export const codeBlock = defineType({
  name: "codeBlock",
  type: "object",
  title: "Code Block",
  icon: () => "🖥️",
  fields: [
    defineField({
      name: "language",
      type: "string",
      title: "Language",
      options: {
        list: [
          { title: "JavaScript", value: "javascript" },
          { title: "TypeScript", value: "typescript" },
          { title: "Python", value: "python" },
          { title: "JSON", value: "json" },
          { title: "HTML", value: "html" },
          { title: "CSS", value: "css" },
          { title: "Bash / Shell", value: "bash" },
          { title: "Plain Text", value: "text" },
        ],
      },
      initialValue: "text",
    }),
    defineField({
      name: "code",
      type: "text",
      title: "Code",
      rows: 12,
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { language: "language", code: "code" },
    prepare({ language, code }) {
      return {
        title: `Code: ${language ?? "plain text"}`,
        subtitle: code?.substring(0, 60) ?? "",
      };
    },
  },
});
