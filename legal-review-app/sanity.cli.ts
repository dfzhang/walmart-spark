import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  app: {
    organizationId: undefined, // Set during `sanity deploy`
    entry: "./src/App.tsx",
  },
});
