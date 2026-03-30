/**
 * Remove orphaned fields from articles that are not in the current schema.
 *
 * Fields to remove:
 * - content: old body field from initial import (renamed to body)
 * - publishedAt: set by original import, not in schema
 * - updatedAt: set by original import, not in schema
 */

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "o01w1nx2",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

async function main() {
  const articles = await client.fetch(
    `*[_type == "article" && (defined(content) || defined(publishedAt) || defined(updatedAt))]{
      _id,
      title,
      "hasContent": defined(content),
      "hasPublishedAt": defined(publishedAt),
      "hasUpdatedAt": defined(updatedAt)
    }`
  );

  console.log(`Found ${articles.length} articles with orphaned fields\n`);

  if (articles.length === 0) {
    console.log("Nothing to clean up.");
    return;
  }

  const transaction = client.transaction();

  for (const article of articles) {
    const fields = [];
    if (article.hasContent) fields.push("content");
    if (article.hasPublishedAt) fields.push("publishedAt");
    if (article.hasUpdatedAt) fields.push("updatedAt");

    transaction.patch(article._id, { unset: fields });
    console.log(`✓ ${article.title}: removing ${fields.join(", ")}`);
  }

  console.log(`\nCommitting cleanup for ${articles.length} articles...`);

  try {
    await transaction.commit();
    console.log(`\n✅ Done! Removed orphaned fields from ${articles.length} articles.`);
  } catch (err) {
    console.error("❌ Transaction failed:", err.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
