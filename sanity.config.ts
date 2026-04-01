import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { presentationTool } from "sanity/presentation";
import { agentContextPlugin } from "@sanity/agent-context/studio";
import { documentInternationalization } from "@sanity/document-internationalization";
import { assist } from "@sanity/assist";
import { schemaTypes } from "./sanity/schemas";
import { structure, newDocumentOptions } from "./sanity/deskStructure";
import { resolve } from "./sanity/presentation/resolve";

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
    agentContextPlugin(),
  ],

  schema: {
    types: schemaTypes,
    templates: newDocumentOptions,
  },
});
