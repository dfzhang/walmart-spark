import { defineType, defineField, defineArrayMember } from "sanity";

/**
 * Standalone document for approval log entries.
 *
 * Uses the ID pattern `approval-log.{publishedArticleId}` — one document
 * per article, surviving publish cycles (unlike fields on the article
 * itself, which get overwritten when Sanity replaces the published doc
 * with the draft).
 *
 * Same pattern as `workflow-metadata.{docId}`.
 */
export const approvalLog = defineType({
  name: "approvalLog",
  title: "Approval Log",
  type: "document",
  // Hidden from "Create new document" — managed by the legal review guard
  __experimental_omnisearch_visibility: false,
  fields: [
    defineField({
      name: "entries",
      type: "array",
      title: "Log Entries",
      readOnly: true,
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "stage",
              type: "string",
              title: "Stage",
            }),
            defineField({
              name: "action",
              type: "string",
              title: "Action",
            }),
            defineField({
              name: "userId",
              type: "string",
              title: "User ID",
            }),
            defineField({
              name: "userName",
              type: "string",
              title: "User Name",
            }),
            defineField({
              name: "timestamp",
              type: "datetime",
              title: "Timestamp",
            }),
            defineField({
              name: "comment",
              type: "text",
              title: "Comment",
            }),
            defineField({
              name: "documentRevision",
              type: "string",
              title: "Document Revision",
              description: "The _rev of the document at the time of this action.",
            }),
            defineField({
              name: "documentId",
              type: "string",
              title: "Document ID",
              description:
                "The _id (may be drafts.xxx) of the document at the time of this action. Used to fetch the correct revision from the History API.",
            }),
          ],
        }),
      ],
    }),
  ],
});
