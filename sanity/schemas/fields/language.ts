import { defineField } from "sanity";

/**
 * Hidden, read-only language field required by @sanity/document-internationalization.
 * Add this to every document type that supports translation.
 */
export const languageField = defineField({
  name: "language",
  type: "string",
  readOnly: true,
  hidden: true,
  initialValue: "en",
});
