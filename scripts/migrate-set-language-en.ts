/**
 * One-time migration: set language: "en" on all existing documents
 * that support i18n but don't have a language field yet.
 *
 * Usage:
 *   SANITY_TOKEN=<write-token> npx tsx scripts/migrate-set-language-en.ts
 *
 * Dry run (default): prints what would be patched without making changes.
 * Live run: SANITY_TOKEN=<token> npx tsx scripts/migrate-set-language-en.ts --execute
 */

import { createClient } from "@sanity/client";

const I18N_TYPES = ["article", "category", "banner", "helpCenterSettings"];

const client = createClient({
  projectId: "o01w1nx2",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_TOKEN,
});

async function migrate() {
  const execute = process.argv.includes("--execute");

  if (!process.env.SANITY_TOKEN) {
    console.error("Error: SANITY_TOKEN environment variable is required.");
    console.error(
      "Create a write token at https://www.sanity.io/manage/project/o01w1nx2/api#tokens"
    );
    process.exit(1);
  }

  // Find all docs of i18n types where language is not set
  const query = `*[_type in $types && !defined(language)]{ _id, _type, title }`;
  const docs = await client.fetch(query, { types: I18N_TYPES });

  if (docs.length === 0) {
    console.log("✅ No documents need migration — all have language set.");
    return;
  }

  console.log(
    `Found ${docs.length} document(s) without language field:\n`
  );
  for (const doc of docs) {
    console.log(`  ${doc._type.padEnd(22)} ${doc._id.padEnd(40)} ${doc.title ?? "(no title)"}`);
  }

  if (!execute) {
    console.log(
      `\n🔍 Dry run — no changes made. Run with --execute to apply patches.`
    );
    return;
  }

  console.log(`\n⏳ Patching ${docs.length} document(s)...`);

  // Bulk patch using a transaction
  const tx = client.transaction();
  for (const doc of docs) {
    tx.patch(doc._id, (p) => p.set({ language: "en" }));
  }

  const result = await tx.commit();
  console.log(
    `✅ Migration complete — ${docs.length} document(s) patched. Transaction ID: ${result.transactionId}`
  );
}

migrate().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
