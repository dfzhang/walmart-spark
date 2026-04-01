import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { presentationTool } from "sanity/presentation";
import { agentContextPlugin } from "@sanity/agent-context/studio";
import { documentInternationalization } from "@sanity/document-internationalization";
import { assist } from "@sanity/assist";
import { workflow, defineStates } from "sanity-plugin-workflow";
import { schemaTypes } from "./sanity/schemas";
import { structure, newDocumentOptions } from "./sanity/deskStructure";
import { resolve } from "./sanity/presentation/resolve";
import { legalReviewActions } from "./sanity/actions/legalReviewGuard";
import { disableWorkflowDrag } from "./sanity/plugins/disableWorkflowDrag";

/** Supported languages — English (default) + Spanish */
export const i18n = {
  languages: [
    { id: "en", title: "English" },
    { id: "es", title: "Spanish" },
  ],
  defaultLanguage: "en" as const,
  /** Schema types that support document-level translation */
  schemaTypes: ["article", "category", "banner", "helpCenterSettings"],
};

export default defineConfig({
  name: "spark-driver-help-center",
  title: "Spark Driver™ Help Center",

  projectId: "o01w1nx2",
  dataset: "production",

  plugins: [
    structureTool({ structure }),
    presentationTool({
      resolve,
      allowOrigins: [
        "https://walmart-spark-ten.vercel.app",
        "http://localhost:*",
      ],
      previewUrl: {
        origin:
          process.env.SANITY_STUDIO_PREVIEW_URL || "http://localhost:3000",
        previewMode: {
          enable: "/api/draft-mode/enable",
        },
      },
    }),
    documentInternationalization({
      supportedLanguages: i18n.languages,
      schemaTypes: i18n.schemaTypes,
    }),
    assist({
      translate: {
        document: {
          languageField: "language",
          documentTypes: [...i18n.schemaTypes],
        },
      },
    }),
    workflow({
      schemaTypes: [...i18n.schemaTypes],
      states: defineStates([
        {
          id: "inReview",
          title: "In Review",
          color: "primary",
          transitions: ["changesRequested", "pendingLegalReview", "approved"],
        },
        {
          id: "pendingLegalReview",
          title: "Pending Legal Review",
          color: "warning",
          transitions: ["changesRequested", "approved"],
        },
        {
          id: "changesRequested",
          title: "Changes Requested",
          color: "warning",
          transitions: ["inReview", "pendingLegalReview", "approved"],
        },
        {
          id: "approved",
          title: "Approved",
          color: "success",
          transitions: ["changesRequested"],
        },
      ]),
    }),
    disableWorkflowDrag(),
    agentContextPlugin(),
  ],

  schema: {
    types: schemaTypes,
    templates: newDocumentOptions,
  },

  document: {
    actions: legalReviewActions,
  },
});
