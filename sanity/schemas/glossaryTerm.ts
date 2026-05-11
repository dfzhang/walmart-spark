import { defineField, defineType } from "sanity";

export const glossaryTerm = defineType({
  name: "glossaryTerm",
  type: "document",
  title: "Glossary Term",
  icon: () => "📖",
  fields: [
    defineField({
      name: "bannedTerm",
      type: "string",
      title: "Banned Term",
      description: "The word or phrase to flag in content.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "preferredTerm",
      type: "string",
      title: "Preferred Alternative",
      description: "Suggested replacement term. Leave empty if the term should simply be removed.",
    }),
    defineField({
      name: "severity",
      type: "string",
      title: "Severity",
      description: "Error blocks publish. Warning allows publish with acknowledgment.",
      options: {
        list: [
          { title: "Error (blocks publish)", value: "error" },
          { title: "Warning (non-blocking)", value: "warning" },
        ],
        layout: "radio",
      },
      initialValue: "warning",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "notes",
      type: "text",
      title: "Notes",
      description: "Editorial context for why this term is banned.",
      rows: 3,
    }),
  ],
  preview: {
    select: {
      bannedTerm: "bannedTerm",
      preferredTerm: "preferredTerm",
      severity: "severity",
    },
    prepare({ bannedTerm, preferredTerm, severity }) {
      const icon = severity === "error" ? "🚫" : "⚠️";
      return {
        title: `${icon} ${bannedTerm}`,
        subtitle: preferredTerm
          ? `→ ${preferredTerm}`
          : "(remove reference)",
      };
    },
  },
  orderings: [
    {
      title: "Severity, then A-Z",
      name: "severityAz",
      by: [
        { field: "severity", direction: "asc" },
        { field: "bannedTerm", direction: "asc" },
      ],
    },
  ],
});
