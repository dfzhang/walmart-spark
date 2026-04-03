/**
 * One-time migration: extract inline faqSection blocks from articles
 * into standalone faq + faqCollection documents.
 *
 * What it does:
 *   1. Fetches all articles with faqSection blocks in their body
 *   2. For each faqSection, creates individual `faq` documents (one per Q&A)
 *   3. Groups them into a `faqCollection` document (one per faqSection block)
 *   4. Replaces the faqSection block in the article body with a faqCollectionRef
 *
 * IDs are deterministic (based on article slug + block key) so the script
 * is safe to run multiple times — existing documents won't be duplicated.
 *
 * Usage:
 *   SANITY_TOKEN=<write-token> npx tsx scripts/migrate-faq-to-documents.ts
 *   SANITY_TOKEN=<write-token> npx tsx scripts/migrate-faq-to-documents.ts --execute
 */

import { createClient } from "@sanity/client";
import crypto from "crypto";

const client = createClient({
  projectId: "o01w1nx2",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_TOKEN,
});

// ── Types ──────────────────────────────────────────────────────

interface FaqItem {
  _key: string;
  _type: string;
  question: string;
  answer: unknown[];
}

interface FaqSectionBlock {
  _key: string;
  _type: "faqSection";
  items: FaqItem[];
  [key: string]: unknown;
}

interface BodyBlock {
  _key: string;
  _type: string;
  items?: FaqItem[];
  [key: string]: unknown;
}

interface Article {
  _id: string;
  title: string;
  slug: { current: string };
  language?: string;
  body: BodyBlock[];
}

// ── Helpers ────────────────────────────────────────────────────

/** Generate a deterministic ID from a seed string. */
function deterministicId(prefix: string, seed: string): string {
  const hash = crypto.createHash("sha256").update(seed).digest("hex").slice(0, 12);
  return `${prefix}-${hash}`;
}

/** Generate a URL-friendly slug from text. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);
}

/** Generate a random _key for Portable Text blocks. */
function randomKey(): string {
  return crypto.randomBytes(6).toString("hex");
}

// ── Known FAQ collection names ─────────────────────────────────
// Maps article slugs to human-readable collection titles.
// Falls back to "{Article Title} FAQs" for unknown articles.
const COLLECTION_NAMES: Record<string, string> = {
  "bagging-tips": "Bagging & Boxing Tips",
  "delivery-faqs": "Delivery FAQs",
  "earnings": "Earnings FAQ",
  "earnings-qby": "Spark Driver Rewards FAQ",
  "general-faqs": "General FAQs",
};

// ── Migration ──────────────────────────────────────────────────

interface MigrationPlan {
  article: Article;
  faqDocs: Array<{
    _id: string;
    _type: "faq";
    question: string;
    slug: { _type: "slug"; current: string };
    answer: unknown[];
    language: string;
  }>;
  collectionDoc: {
    _id: string;
    _type: "faqCollection";
    title: string;
    slug: { _type: "slug"; current: string };
    items: Array<{ _type: "reference"; _ref: string; _key: string }>;
    language: string;
  };
  /** The faqSection block key being replaced */
  blockKey: string;
  /** The replacement faqCollectionRef block */
  replacementBlock: {
    _key: string;
    _type: "faqCollectionRef";
    collection: { _type: "reference"; _ref: string };
  };
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

  // Fetch all articles that have faqSection blocks
  const articles: Article[] = await client.fetch(
    `*[_type == "article" && defined(body) && count(body[_type == "faqSection"]) > 0]{
      _id, title, slug, language, body
    }`
  );

  if (articles.length === 0) {
    console.log("✅ No articles have faqSection blocks — nothing to migrate.");
    return;
  }

  const plans: MigrationPlan[] = [];
  let totalFaqs = 0;

  for (const article of articles) {
    const articleSlug = article.slug?.current ?? article._id;
    const language = article.language ?? "en";

    // Find all faqSection blocks in this article
    const faqSections = article.body.filter(
      (b): b is FaqSectionBlock => b._type === "faqSection"
    );

    for (let sectionIdx = 0; sectionIdx < faqSections.length; sectionIdx++) {
      const section = faqSections[sectionIdx];
      const items = section.items ?? [];
      if (items.length === 0) continue;

      // Seed for deterministic IDs: article slug + block key
      const sectionSeed = `${articleSlug}:${section._key}`;

      // Create faq documents for each Q&A item
      const faqDocs: MigrationPlan["faqDocs"] = items.map((item, itemIdx) => {
        const faqId = deterministicId("faq", `${sectionSeed}:${item._key}`);
        const questionSlug = slugify(item.question);
        return {
          _id: faqId,
          _type: "faq" as const,
          question: item.question,
          slug: { _type: "slug" as const, current: questionSlug || `faq-${itemIdx}` },
          answer: item.answer,
          language,
        };
      });

      // Create faqCollection document
      const collectionTitle =
        COLLECTION_NAMES[articleSlug] ??
        (faqSections.length > 1
          ? `${article.title} FAQs (${sectionIdx + 1})`
          : `${article.title} FAQs`);
      const collectionId = deterministicId("faqcol", sectionSeed);
      const collectionSlug = slugify(collectionTitle);

      const collectionDoc: MigrationPlan["collectionDoc"] = {
        _id: collectionId,
        _type: "faqCollection",
        title: collectionTitle,
        slug: { _type: "slug", current: collectionSlug },
        items: faqDocs.map((faq) => ({
          _type: "reference",
          _ref: faq._id,
          _key: randomKey(),
        })),
        language,
      };

      // Replacement block for the article body
      const replacementBlock: MigrationPlan["replacementBlock"] = {
        _key: section._key, // Reuse the same key to maintain position
        _type: "faqCollectionRef",
        collection: { _type: "reference", _ref: collectionId },
      };

      totalFaqs += faqDocs.length;
      plans.push({
        article,
        faqDocs,
        collectionDoc,
        blockKey: section._key,
        replacementBlock,
      });
    }
  }

  // ── Report ─────────────────────────────────────────────────

  console.log(
    `Found ${totalFaqs} FAQ item(s) across ${plans.length} section(s) in ${articles.length} article(s):\n`
  );

  for (const plan of plans) {
    console.log(
      `  📄 ${plan.article.title} → "${plan.collectionDoc.title}" (${plan.faqDocs.length} items)`
    );
    for (const faq of plan.faqDocs) {
      console.log(`     ❓ ${faq.question}`);
    }
    console.log(`     📋 Collection ID: ${plan.collectionDoc._id}`);
    console.log();
  }

  console.log(
    `Summary: ${totalFaqs} faq docs + ${plans.length} faqCollection docs + ${plans.length} article body patches\n`
  );

  if (!execute) {
    console.log(
      "🔍 Dry run — no changes made. Run with --execute to apply."
    );
    return;
  }

  // ── Execute ────────────────────────────────────────────────

  console.log("⏳ Creating documents and patching articles...\n");

  const tx = client.transaction();

  for (const plan of plans) {
    // Create faq documents (createIfNotExists for idempotency)
    for (const faqDoc of plan.faqDocs) {
      tx.createIfNotExists(faqDoc);
    }

    // Create faqCollection document
    tx.createIfNotExists(plan.collectionDoc);

    // Patch article body: replace faqSection block with faqCollectionRef
    const newBody = plan.article.body.map((block) => {
      if (block._key === plan.blockKey && block._type === "faqSection") {
        return plan.replacementBlock;
      }
      return block;
    });
    tx.patch(plan.article._id, (p) => p.set({ body: newBody }));
  }

  const result = await tx.commit();
  console.log(
    `✅ Migration complete — ${totalFaqs} faq docs + ${plans.length} faqCollection docs created, ${plans.length} article(s) patched. Transaction ID: ${result.transactionId}`
  );
}

migrate().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
