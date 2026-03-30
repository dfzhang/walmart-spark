/**
 * Convert external HelpDocs links in article bodies to internal Sanity references.
 *
 * What this does:
 * 1. Builds a HelpDocs slug → Sanity _id lookup table
 * 2. Walks every article's body blocks
 * 3. Converts `link` marks (external URLs) pointing to HelpDocs articles
 *    into `internalLink` marks (Sanity references)
 * 4. Patches the documents in Sanity
 */

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "o01w1nx2",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

// ── Step 1: Build lookup tables ──────────────────────────────

async function buildLookup() {
  const articles = await client.fetch(
    `*[_type == "article"]{_id, "slug": slug.current, title}`
  );

  // Map Sanity slug → _id (e.g., "accepting-an-offer" → "article-accepting-an-offer")
  const sanitySlugToId = new Map();
  for (const a of articles) {
    sanitySlugToId.set(a.slug, a._id);
  }

  return { articles, sanitySlugToId };
}

// Extract the descriptive part from a HelpDocs slug
// e.g., "osihlkx19j-logging-into-a-spark-driver-account" → "logging-into-a-spark-driver-account"
// The HelpDocs prefix is always an alphanumeric ID followed by a dash
function helpdocsSlugToSanitySlug(helpdocsSlug) {
  // Remove the random prefix (e.g., "osihlkx19j-")
  const match = helpdocsSlug.match(/^[a-z0-9]+-(.+)$/);
  return match ? match[1] : helpdocsSlug;
}

// Check if a URL points to a HelpDocs article
function parseHelpdocsArticleUrl(href) {
  if (!href) return null;

  // Patterns:
  // https://sparkdriverapp-walmart.helpdocs.io/l/en/article/SLUG
  // /l/en/article/SLUG
  const patterns = [
    /(?:https?:\/\/sparkdriverapp-walmart\.helpdocs\.io)?\/l\/en\/article\/([^\s?#]+)/,
    /helpdocs\.io\/.*\/article\/([^\s?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = href.match(pattern);
    if (match) return match[1]; // HelpDocs slug
  }
  return null;
}

// ── Step 2: Convert links in a single article ────────────────

function convertArticleLinks(article, sanitySlugToId) {
  if (!article.body || !Array.isArray(article.body)) return null;

  let changed = false;
  const newBody = article.body.map((block) => {
    // Only process text blocks with markDefs
    if (block._type !== "block" || !block.markDefs || block.markDefs.length === 0) {
      return block;
    }

    const newMarkDefs = block.markDefs.map((markDef) => {
      if (markDef._type !== "link") return markDef;

      const helpdocsSlug = parseHelpdocsArticleUrl(markDef.href);
      if (!helpdocsSlug) return markDef; // Not a HelpDocs link, keep as-is

      const sanitySlug = helpdocsSlugToSanitySlug(helpdocsSlug);
      const sanityId = sanitySlugToId.get(sanitySlug);

      if (!sanityId) {
        console.warn(
          `  ⚠ No Sanity match for HelpDocs slug "${helpdocsSlug}" → "${sanitySlug}" in "${article.title}"`
        );
        return markDef; // Keep as external link
      }

      changed = true;
      // Convert to internalLink
      return {
        _key: markDef._key,
        _type: "internalLink",
        reference: {
          _type: "reference",
          _ref: sanityId,
        },
      };
    });

    return { ...block, markDefs: newMarkDefs };
  });

  return changed ? newBody : null;
}

// ── Step 3: Run migration ────────────────────────────────────

async function main() {
  console.log("Building lookup tables...");
  const { articles, sanitySlugToId } = await buildLookup();
  console.log(`Found ${articles.length} articles, ${sanitySlugToId.size} slugs mapped.\n`);

  // Fetch all articles with body content
  const fullArticles = await client.fetch(
    `*[_type == "article" && defined(body)]{_id, title, "slug": slug.current, body}`
  );

  let converted = 0;
  let totalLinksConverted = 0;
  let failed = 0;

  const transaction = client.transaction();

  for (const article of fullArticles) {
    const newBody = convertArticleLinks(article, sanitySlugToId);
    if (!newBody) continue;

    // Count how many links were converted
    const oldLinkCount = article.body.reduce(
      (sum, b) => sum + (b.markDefs?.filter((m) => m._type === "link" && parseHelpdocsArticleUrl(m.href))?.length || 0),
      0
    );
    const newLinkCount = newBody.reduce(
      (sum, b) => sum + (b.markDefs?.filter((m) => m._type === "link" && parseHelpdocsArticleUrl(m.href))?.length || 0),
      0
    );
    const linksConverted = oldLinkCount - newLinkCount;

    console.log(`✓ ${article.title}: ${linksConverted} link(s) converted`);
    totalLinksConverted += linksConverted;

    transaction.patch(article._id, { set: { body: newBody } });
    converted++;
  }

  if (converted === 0) {
    console.log("\nNo links to convert.");
    return;
  }

  console.log(`\nCommitting ${converted} articles (${totalLinksConverted} links)...`);

  try {
    await transaction.commit();
    console.log(`✅ Done! ${converted} articles updated, ${totalLinksConverted} links converted to internal references.`);
  } catch (err) {
    console.error("❌ Transaction failed:", err.message);
    failed++;
  }

  if (failed > 0) {
    console.error(`\n${failed} failures.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
