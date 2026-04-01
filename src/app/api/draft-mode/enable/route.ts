import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { client } from "@/lib/sanity/client";

const token = process.env.SANITY_API_READ_TOKEN;
if (!token) {
  throw new Error("Missing SANITY_API_READ_TOKEN for draft mode");
}

export const { GET } = defineEnableDraftMode({
  client: client.withConfig({ token }),
});
