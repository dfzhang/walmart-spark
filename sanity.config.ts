import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { agentContextPlugin } from "@sanity/agent-context/studio";
import { schemaTypes } from "./sanity/schemas";
import { structure, newDocumentOptions } from "./sanity/deskStructure";

export default defineConfig({
  name: "spark-driver-help-center",
  title: "Spark Driver™ Help Center",

  projectId: "o01w1nx2",
  dataset: "production",

  plugins: [
    structureTool({ structure }),
    agentContextPlugin(),
  ],

  schema: {
    types: schemaTypes,
    templates: newDocumentOptions,
  },
});
