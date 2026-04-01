// Client-safe exports only — no server-only modules (live.ts, queries.ts).
// Server components should import fetchers directly from "@/lib/sanity/queries".
export { client } from "./client";
export { sanityConfig } from "./config";
export { urlForImage } from "./image";
