import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  app: {
    organizationId: "oKQf3hPlq", // Set during `sanity deploy`
    entry: "./src/App.tsx",
  },
});
