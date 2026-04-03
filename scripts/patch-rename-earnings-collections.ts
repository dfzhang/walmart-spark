/**
 * Patch: Rename 3 earnings FAQ collections that were created with
 * the generic "Earnings FAQ" title before the per-section naming fix.
 *
 * Usage:
 *   SANITY_TOKEN=<token> npx tsx scripts/patch-rename-earnings-collections.ts [--execute]
 *
 * Dry run by default — prints planned changes without applying them.
 */

import { createClient } from "@sanity/client";

const SANITY_TOKEN = process.env.SANITY_TOKEN;
if (!SANITY_TOKEN) {
  console.error("❌ SANITY_TOKEN environment variable is required.");
  process.exit(1);
}

const client = createClient({
  projectId: "o01w1nx2",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: SANITY_TOKEN,
  useCdn: false,
});

const execute = process.argv.includes("--execute");

const RENAMES: Array<{ _id: string; title: string; slug: string }> = [
  {
    _id: "faqcol-1765e7f903c1",
    title: "OnePay FAQ",
    slug: "onepay-faq",
  },
  {
    _id: "faqcol-ebd4d4298423",
    title: "Earnings & Incentives FAQ",
    slug: "earnings-incentives-faq",
  },
  {
    _id: "faqcol-f1aaa9af77ff",
    title: "Direct Deposit FAQ",
    slug: "direct-deposit-faq",
  },
];

async function patch() {
  // Verify all 3 documents exist before patching
  const ids = RENAMES.map((r) => r._id);
  const existing = await client.fetch<Array<{ _id: string; title: string; slug: { current: string } }>>(
    `*[_id in $ids]{ _id, title, slug }`,
    { ids }
  );

  const existingMap = new Map(existing.map((doc) => [doc._id, doc]));

  for (const rename of RENAMES) {
    const doc = existingMap.get(rename._id);
    if (!doc) {
      console.error(`❌ Document ${rename._id} not found in dataset. Aborting.`);
      process.exit(1);
    }
    console.log(
      `📝 ${rename._id}: "${doc.title}" (${doc.slug.current}) → "${rename.title}" (${rename.slug})`
    );
  }

  if (!execute) {
    console.log("\n🔍 Dry run — no changes made. Run with --execute to apply.");
    return;
  }

  const tx = client.transaction();
  for (const rename of RENAMES) {
    tx.patch(rename._id, (p) =>
      p.set({ title: rename.title, slug: { _type: "slug", current: rename.slug } })
    );
  }

  const result = await tx.commit();
  console.log(`\n✅ Renamed ${RENAMES.length} collections. Transaction ID: ${result.transactionId}`);
}

patch().catch((err) => {
  console.error("Patch failed:", err.message);
  process.exit(1);
});
