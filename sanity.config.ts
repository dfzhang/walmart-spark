import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { agentContextPlugin } from "@sanity/agent-context/studio";
import { documentInternationalization } from "@sanity/document-internationalization";
import { schemaTypes } from "./sanity/schemas";
import { structure, newDocumentOptions } from "./sanity/deskStructure";

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
    documentInternationalization({
      supportedLanguages: i18n.languages,
      schemaTypes: i18n.schemaTypes,
    }),
    agentContextPlugin(),
  ],

  schema: {
    types: schemaTypes,
    templates: newDocumentOptions,
  },
});
