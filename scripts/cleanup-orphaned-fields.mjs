/**
 * Cleanup script: removes orphaned fields and populates relatedArticles
 * 
 * 1. Removes orphaned fields: content, publishedAt, updatedAt
 * 2. Populates relatedArticles metadata from internalLink references in body
 * 
 * Usage: node scripts/cleanup-orphaned-fields.mjs
 * Requires: SANITY_API_TOKEN env var (with write access)
 */

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "o01w1nx2",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const ORPHANED_FIELDS = ["content", "publishedAt", "updatedAt"];

async function main() {
  // Fetch all articles
  const articles = await client.fetch(`
    *[_type == "article"]{
      _id,
      title,
      "slug": slug.current,
      relatedArticles,
      "internalLinkRefs": body[].markDefs[_type == "internalLink"].reference._ref
    }
  `);

  console.log(`Found ${articles.length} articles\n`);

  let orphanCleanups = 0;
  let relatedPopulated = 0;
  const transaction = client.transaction();
  let hasChanges = false;

  for (const article of articles) {
    // Check raw document for orphaned field keys
    const rawDoc = await client.getDocument(article._id);
    if (!rawDoc) continue;

    const fieldsToUnset = ORPHANED_FIELDS.filter(f => f in rawDoc);

    // Check if relatedArticles needs populating
    const existingRelated = article.relatedArticles || [];
    const internalRefs = article.internalLinkRefs || [];
    const uniqueRefs = [...new Set(internalRefs)]
      .filter(ref => ref !== article._id)
      .slice(0, 5);
    const needsRelated = existingRelated.length === 0 && uniqueRefs.length > 0;

    if (fieldsToUnset.length === 0 && !needsRelated) continue;

    // Build patch
    transaction.patch(article._id, (patch) => {
      if (fieldsToUnset.length > 0) {
        patch = patch.unset(fieldsToUnset);
        orphanCleanups++;
        console.log(`  ${article.title}: removing [${fieldsToUnset.join(", ")}]`);
      }

      if (needsRelated) {
        const refs = uniqueRefs.map((ref, i) => ({
          _type: "reference",
          _ref: ref,
          _key: `rel${i}`,
        }));
        patch = patch.set({ relatedArticles: refs });
        relatedPopulated++;
        console.log(`  ${article.title}: adding ${refs.length} related articles`);
      }

      return patch;
    });
    hasChanges = true;
  }

  console.log(`\nSummary:`);
  console.log(`  Orphaned field cleanups: ${orphanCleanups}`);
  console.log(`  Related articles populated: ${relatedPopulated}`);

  if (hasChanges) {
    console.log(`\nCommitting transaction...`);
    const result = await transaction.commit();
    console.log(`Done! Transaction ID: ${result.transactionId}`);
  } else {
    console.log(`\nNothing to do.`);
  }
}

main().catch(console.error);
