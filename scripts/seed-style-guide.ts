/**
 * Seed Script: Style Guide Glossary Terms
 *
 * Creates 21 glossaryTerm documents from the Walmart Spark Driver
 * Help Center style guide. Uses deterministic IDs for idempotency.
 *
 * Usage:
 *   SANITY_TOKEN=<token> npx tsx scripts/seed-style-guide.ts [--execute]
 *
 * Dry run by default — prints planned documents without creating them.
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

// ── Deterministic ID ───────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);
}

function termId(bannedTerm: string): string {
  return `glossaryTerm-${slugify(bannedTerm)}`;
}

// ── Term definitions ───────────────────────────────────────────

interface TermDef {
  bannedTerm: string;
  preferredTerm: string | null;
  severity: "error" | "warning";
  notes: string;
}

const TERMS: TermDef[] = [
  // ── Error severity (blocks publish) ──────────────────────────
  {
    bannedTerm: "employees",
    preferredTerm: "independent contractors",
    severity: "error",
    notes: "Spark Drivers are NOT employees — legal liability. 'Gig workers' is also acceptable.",
  },
  {
    bannedTerm: "payments",
    preferredTerm: "earnings",
    severity: "error",
    notes: "Walmart-specific financial terminology.",
  },
  {
    bannedTerm: "deposit",
    preferredTerm: "disbursement",
    severity: "error",
    notes: "Walmart-specific financial terminology.",
  },
  {
    bannedTerm: "Uber",
    preferredTerm: null,
    severity: "error",
    notes: "No competitor mentions in help content.",
  },
  {
    bannedTerm: "DoorDash",
    preferredTerm: null,
    severity: "error",
    notes: "No competitor mentions in help content.",
  },
  {
    bannedTerm: "Instacart",
    preferredTerm: null,
    severity: "error",
    notes: "No competitor mentions in help content.",
  },
  {
    bannedTerm: "fired",
    preferredTerm: "account status changed",
    severity: "error",
    notes: "Never use employment termination language.",
  },

  // ── Warning severity (non-blocking) ──────────────────────────
  {
    bannedTerm: "customer",
    preferredTerm: "member",
    severity: "warning",
    notes: 'Walmart prefers "member" for Walmart+ context.',
  },
  {
    bannedTerm: "delivery guy",
    preferredTerm: "delivery driver",
    severity: "warning",
    notes: "Gender-neutral language required.",
  },
  {
    bannedTerm: "delivery girl",
    preferredTerm: "delivery driver",
    severity: "warning",
    notes: "Gender-neutral language required.",
  },
  {
    bannedTerm: "ASAP",
    preferredTerm: "as soon as possible",
    severity: "warning",
    notes: "Avoid abbreviations in help content.",
  },
  {
    bannedTerm: "app store",
    preferredTerm: "App Store (iOS) / Google Play (Android)",
    severity: "warning",
    notes: "Use platform-specific names.",
  },
  {
    bannedTerm: "deactivated",
    preferredTerm: "account status changed",
    severity: "warning",
    notes: "Softer language for sensitive topics.",
  },
  {
    bannedTerm: "pay cut",
    preferredTerm: "earnings adjustment",
    severity: "warning",
    notes: "Use neutral financial language.",
  },
  {
    bannedTerm: "Walmart truck",
    preferredTerm: "Walmart delivery vehicle",
    severity: "warning",
    notes: "Formal vehicle terminology.",
  },
  {
    bannedTerm: "phone number",
    preferredTerm: "contact information",
    severity: "warning",
    notes: "Privacy-conscious language.",
  },
  {
    bannedTerm: "GPS tracking",
    preferredTerm: "location services",
    severity: "warning",
    notes: "Less surveillance-sounding.",
  },
  {
    bannedTerm: "complaint",
    preferredTerm: "feedback",
    severity: "warning",
    notes: "Positive framing.",
  },
  {
    bannedTerm: "problem",
    preferredTerm: "issue",
    severity: "warning",
    notes: "Neutral framing.",
  },
  {
    bannedTerm: "can't",
    preferredTerm: "cannot",
    severity: "warning",
    notes: "Avoid contractions in formal help content.",
  },
  {
    bannedTerm: "won't",
    preferredTerm: "will not",
    severity: "warning",
    notes: "Avoid contractions in formal help content.",
  },
  {
    bannedTerm: "don't",
    preferredTerm: "do not",
    severity: "warning",
    notes: "Avoid contractions in formal help content.",
  },
];

// ── Main ───────────────────────────────────────────────────────

async function seed() {
  console.log(`📖 Style Guide Seed — ${TERMS.length} glossary terms\n`);

  const docs = TERMS.map((term) => ({
    _id: termId(term.bannedTerm),
    _type: "glossaryTerm" as const,
    bannedTerm: term.bannedTerm,
    preferredTerm: term.preferredTerm ?? undefined,
    severity: term.severity,
    notes: term.notes,
  }));

  for (const doc of docs) {
    const icon = doc.severity === "error" ? "🚫" : "⚠️";
    const preferred = doc.preferredTerm || "(remove reference)";
    console.log(`  ${icon} ${doc.bannedTerm} → ${preferred}  [${doc._id}]`);
  }

  if (!execute) {
    console.log(
      "\n🔍 Dry run — no changes made. Run with --execute to apply.",
    );
    return;
  }

  console.log("\n⏳ Creating glossary terms...\n");

  const tx = client.transaction();
  for (const doc of docs) {
    tx.createIfNotExists(doc);
  }

  const result = await tx.commit();
  console.log(
    `✅ Seeded ${docs.length} glossary terms. Transaction ID: ${result.transactionId}`,
  );
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
