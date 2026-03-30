/**
 * Extract "Related Articles" from body content → relatedArticles metadata field.
 *
 * For each article:
 * 1. Find the "Related Articles" heading in the body
 * 2. Extract article references from the blocks after it
 * 3. Populate the relatedArticles metadata field with those references
 * 4. Strip the "Related Articles" section AND "How did we do?" from the body
 */

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "o01w1nx2",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

function getBlockText(block) {
  if (block._type !== "block" || !block.children) return "";
  return block.children.map((c) => c.text || "").join("").trim();
}

function extractRelatedRefs(blocks, startIdx) {
  const refs = [];
  const seen = new Set();

  for (let i = startIdx; i < blocks.length; i++) {
    const block = blocks[i];
    if (block._type !== "block") continue;

    for (const markDef of block.markDefs || []) {
      // Internal link — already converted to reference
      if (markDef._type === "internalLink" && markDef.reference?._ref) {
        const ref = markDef.reference._ref;
        if (!seen.has(ref)) {
          seen.add(ref);
          refs.push({ _type: "reference", _ref: ref, _key: `rel-${refs.length}` });
        }
      }
      // External link — try to match HelpDocs URL to a Sanity article
      if (markDef._type === "link" && markDef.href) {
        const match = markDef.href.match(/\/article\/[a-z0-9]+-(.+?)$/);
        if (match) {
          const sanityId = `article-${match[1]}`;
          if (!seen.has(sanityId)) {
            seen.add(sanityId);
            refs.push({ _type: "reference", _ref: sanityId, _key: `rel-${refs.length}` });
          }
        }
      }
    }
  }

  return refs.slice(0, 5); // Max 5 per schema validation
}

async function main() {
  const articles = await client.fetch(
    `*[_type == "article" && defined(body)]{_id, title, body, relatedArticles}`
  );

  console.log(`Processing ${articles.length} articles...\n`);

  // Verify all referenced articles exist
  const allArticleIds = new Set(
    (await client.fetch(`*[_type == "article"]._id`))
  );

  const transaction = client.transaction();
  let updated = 0;
  let totalRefs = 0;
  let blocksRemoved = 0;

  for (const article of articles) {
    const body = article.body;
    if (!body || !Array.isArray(body)) continue;

    // Find "How did we do?" and "Related Articles" headings
    let howDidWeDoIdx = -1;
    let relatedArticlesIdx = -1;

    for (let i = body.length - 1; i >= 0; i--) {
      const text = getBlockText(body[i]);
      const style = body[i].style;

      if (text === "How did we do?" && ["h2", "h3", "h4", "h5"].includes(style)) {
        howDidWeDoIdx = i;
      }
      if (text === "Related Articles" && ["h2", "h3", "h4", "h5"].includes(style)) {
        relatedArticlesIdx = i;
      }
    }

    if (relatedArticlesIdx === -1 && howDidWeDoIdx === -1) {
      continue; // Nothing to strip
    }

    // Extract references from blocks after "Related Articles" heading
    const refs = relatedArticlesIdx !== -1
      ? extractRelatedRefs(body, relatedArticlesIdx + 1)
      : [];

    // Filter out refs to non-existent articles
    const validRefs = refs.filter((r) => allArticleIds.has(r._ref));
    if (validRefs.length !== refs.length) {
      const invalid = refs.filter((r) => !allArticleIds.has(r._ref));
      console.warn(`  ⚠ ${article.title}: ${invalid.length} ref(s) to non-existent articles skipped`);
    }

    // Determine where to cut the body
    // Cut from whichever comes first: "How did we do?" or "Related Articles"
    let cutIdx = body.length;
    if (howDidWeDoIdx !== -1) cutIdx = Math.min(cutIdx, howDidWeDoIdx);
    if (relatedArticlesIdx !== -1) cutIdx = Math.min(cutIdx, relatedArticlesIdx);

    const newBody = body.slice(0, cutIdx);
    const removedCount = body.length - newBody.length;

    const patch = { body: newBody };
    if (validRefs.length > 0) {
      patch.relatedArticles = validRefs;
    }

    transaction.patch(article._id, { set: patch });
    updated++;
    totalRefs += validRefs.length;
    blocksRemoved += removedCount;

    console.log(
      `✓ ${article.title}: ${validRefs.length} related ref(s), ${removedCount} block(s) stripped`
    );
  }

  if (updated === 0) {
    console.log("\nNothing to update.");
    return;
  }

  console.log(`\nCommitting ${updated} articles...`);
  console.log(`  ${totalRefs} relatedArticles references populated`);
  console.log(`  ${blocksRemoved} body blocks removed`);

  try {
    await transaction.commit();
    console.log(`\n✅ Done!`);
  } catch (err) {
    console.error("❌ Transaction failed:", err.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
