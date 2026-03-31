/**
 * One-time migration: remove hardcoded TOC anchor-link blocks from articles.
 *
 * Some articles have blocks at the top of their body that are manual table-of-contents
 * entries — each block is a single paragraph containing nothing but a link to an
 * anchor ID (e.g., "Am I eligible?" → #am_i_eligible). Now that the frontend
 * auto-generates a TOC sidebar from headings, these are redundant.
 *
 * Detection: a block is a TOC entry if:
 *   1. It's a "block" type (paragraph)
 *   2. It has exactly one child span
 *   3. That child has exactly one mark
 *   4. The mark references a markDef with an href starting with "#"
 *
 * Usage:
 *   SANITY_TOKEN=<write-token> npx tsx scripts/migrate-remove-anchor-nav.ts
 *   SANITY_TOKEN=<write-token> npx tsx scripts/migrate-remove-anchor-nav.ts --execute
 */

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "o01w1nx2",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_TOKEN,
});

interface MarkDef {
  _key: string;
  _type: string;
  href?: string;
}

interface Child {
  _key: string;
  _type: string;
  text: string;
  marks?: string[];
}

interface Block {
  _key: string;
  _type: string;
  children?: Child[];
  markDefs?: MarkDef[];
}

/** Returns true if the block is a hardcoded TOC anchor link. */
function isAnchorNavBlock(block: Block): boolean {
  if (block._type !== "block") return false;

  const markDefs = block.markDefs ?? [];
  const children = block.children ?? [];

  // Must have exactly one child with exactly one mark
  if (children.length !== 1) return false;
  const child = children[0];
  if (!child.marks || child.marks.length !== 1) return false;

  // The mark must reference a markDef with an anchor href
  const markKey = child.marks[0];
  const markDef = markDefs.find((md) => md._key === markKey);
  if (!markDef || !markDef.href || !markDef.href.startsWith("#")) return false;

  return true;
}

async function migrate() {
  const execute = process.argv.includes("--execute");

  if (!process.env.SANITY_TOKEN) {
    console.error("Error: SANITY_TOKEN environment variable is required.");
    console.error(
      "Create a write token at https://www.sanity.io/manage/project/o01w1nx2/api#tokens"
    );
    process.exit(1);
  }

  const articles: Array<{ _id: string; title: string; body: Block[] }> =
    await client.fetch(
      `*[_type == "article" && defined(body)]{ _id, title, body }`
    );

  let totalRemoved = 0;
  const affectedArticles: Array<{
    id: string;
    title: string;
    removed: Array<{ text: string; href: string }>;
    cleanedBody: Block[];
  }> = [];

  for (const article of articles) {
    const removed: Array<{ text: string; href: string }> = [];
    const cleanedBody: Block[] = [];

    for (const block of article.body) {
      if (isAnchorNavBlock(block)) {
        const child = block.children![0];
        const markDef = block.markDefs!.find(
          (md) => md._key === child.marks![0]
        )!;
        removed.push({ text: child.text, href: markDef.href! });
      } else {
        cleanedBody.push(block);
      }
    }

    if (removed.length > 0) {
      totalRemoved += removed.length;
      affectedArticles.push({
        id: article._id,
        title: article.title,
        removed,
        cleanedBody,
      });
    }
  }

  if (affectedArticles.length === 0) {
    console.log("✅ No articles have hardcoded TOC blocks — nothing to clean.");
    return;
  }

  console.log(
    `Found ${totalRemoved} TOC block(s) across ${affectedArticles.length} article(s):\n`
  );

  for (const article of affectedArticles) {
    console.log(
      `  📄 ${article.title} (${article.removed.length} blocks to remove)`
    );
    for (const entry of article.removed) {
      console.log(`     ✂️  "${entry.text.trim()}" → ${entry.href}`);
    }
  }

  if (!execute) {
    console.log(
      `\n🔍 Dry run — no changes made. Run with --execute to apply patches.`
    );
    return;
  }

  console.log(`\n⏳ Patching ${affectedArticles.length} article(s)...`);

  const tx = client.transaction();
  for (const article of affectedArticles) {
    tx.patch(article.id, (p) => p.set({ body: article.cleanedBody }));
  }

  const result = await tx.commit();
  console.log(
    `✅ Migration complete — removed ${totalRemoved} TOC block(s) from ${affectedArticles.length} article(s). Transaction ID: ${result.transactionId}`
  );
}

migrate().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
