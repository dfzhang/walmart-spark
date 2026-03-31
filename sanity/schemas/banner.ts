import { defineField, defineType } from "sanity";
import { languageField } from "./fields/language";

export const banner = defineType({
  name: "banner",
  type: "document",
  title: "Notification Banner",
  icon: () => "📢",
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Internal Label",
      description: "For editorial reference only — not displayed on the site.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "message",
      type: "string",
      title: "Banner Message",
      description: "The text displayed to users. Keep it short and actionable.",
      validation: (Rule) => Rule.required().max(200),
    }),
    defineField({
      name: "severity",
      type: "string",
      title: "Severity",
      description: "Controls the banner color and ARIA behavior.",
      options: {
        list: [
          { title: "Announcement (blue)", value: "announcement" },
          { title: "Warning (yellow)", value: "warning" },
          { title: "Critical (red)", value: "critical" },
        ],
        layout: "radio",
      },
      initialValue: "announcement",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "isActive",
      type: "boolean",
      title: "Active",
      description: "Only active banners are displayed. Deactivate instead of deleting for history.",
      initialValue: false,
    }),

    // ── i18n ───────────────────────────────────────────────────
    languageField,
  ],
  preview: {
    select: { title: "title", severity: "severity", isActive: "isActive" },
    prepare({ title, severity, isActive }) {
      const icon = severity === "critical" ? "🔴" : severity === "warning" ? "🟡" : "🔵";
      return {
        title: `${icon} ${title}`,
        subtitle: isActive ? "Active" : "Inactive",
      };
    },
  },
});
