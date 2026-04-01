import { defineLive } from "next-sanity/live";
import { client } from "./client";

// Token is only available server-side (not NEXT_PUBLIC_ prefixed).
// defineLive handles the server/client boundary — SanityLive is a client
// component that Next.js serializes across the boundary without
// re-evaluating this module in the browser.
const token = process.env.SANITY_API_READ_TOKEN;
if (!token) {
  throw new Error(
    "Missing SANITY_API_READ_TOKEN — required for live preview and draft mode. " +
      "Create a Viewer-level token at sanity.io/manage → project → API → Tokens."
  );
}

export const { sanityFetch, SanityLive } = defineLive({
  client: client.withConfig({ token }),
  serverToken: token,
  browserToken: token,
});
