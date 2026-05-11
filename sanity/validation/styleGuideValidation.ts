/**
 * Style Guide field validation — real-time inline validation for article fields.
 *
 * Uses a module-level glossary term cache with a Sanity client listener so
 * terms are fetched once and kept in sync without re-fetching on every keystroke.
 *
 * Usage in schema:
 *   validation: (Rule) => [
 *     Rule.required(),
 *     ...styleGuideRules(Rule, "string"),
 *   ]
 */
import {
  type CustomValidator,
  type RuleDef,
  type SanityClient,
} from "sanity";
import { toPlainText } from "@portabletext/toolkit";

const API_VERSION = "2024-01-01";

// ── Types ──────────────────────────────────────────────────────

interface GlossaryTerm {
  _id: string;
  bannedTerm: string;
  preferredTerm: string | null;
  severity: "error" | "warning";
}

// ── Module-level cache ─────────────────────────────────────────

let cachedTerms: GlossaryTerm[] = [];
let cacheInitialized = false;

const GLOSSARY_QUERY = `*[_type == "glossaryTerm"]{ _id, bannedTerm, preferredTerm, severity }`;

/**
 * Initialize the glossary term cache. Safe to call multiple times —
 * only the first call fetches and subscribes.
 */
function ensureCache(client: SanityClient): void {
  if (cacheInitialized) return;
  cacheInitialized = true;

  // Initial fetch
  client
    .fetch<GlossaryTerm[]>(GLOSSARY_QUERY)
    .then((terms) => {
      cachedTerms = terms;
    })
    .catch(() => {
      cachedTerms = [];
    });

  // Subscribe to changes — re-fetch on any glossaryTerm mutation
  client
    .listen(GLOSSARY_QUERY, {}, { includeResult: false })
    .subscribe(() => {
      client
        .fetch<GlossaryTerm[]>(GLOSSARY_QUERY)
        .then((terms) => {
          cachedTerms = terms;
        })
        .catch(() => {
          // Keep stale cache on fetch failure
        });
    });
}

// ── Text extraction ────────────────────────────────────────────

/**
 * Extract plain text from a Portable Text array.
 * Filters to block-level content only — skips images, code blocks, etc.
 */
function extractPortableText(blocks: unknown): string {
  if (!Array.isArray(blocks)) return "";
  const textBlocks = blocks.filter(
    (b: unknown): b is { _type: string; children: unknown[] } =>
      typeof b === "object" &&
      b !== null &&
      "_type" in b &&
      (b as { _type: string })._type === "block",
  );
  if (textBlocks.length === 0) return "";
  return toPlainText(textBlocks);
}

// ── Matching ───────────────────────────────────────────────────

/**
 * Build a word-boundary regex for a banned term.
 */
function buildTermRegex(bannedTerm: string): RegExp {
  const escaped = bannedTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "gi");
}

/**
 * Format a violation into a human-readable message.
 */
function formatMessage(
  term: string,
  preferred: string | null,
  count: number,
): string {
  const replacement = preferred
    ? `use "${preferred}" instead`
    : "remove this reference";
  const countSuffix = count > 1 ? ` (${count} occurrences)` : "";
  return `Banned term "${term}" — ${replacement}${countSuffix}`;
}

/**
 * Scan text for banned terms of a given severity.
 * Returns formatted messages or true if clean.
 */
function scanForSeverity(
  text: string,
  severity: "error" | "warning",
): true | string {
  const terms = cachedTerms.filter((t) => t.severity === severity);
  const messages: string[] = [];

  for (const term of terms) {
    if (!term.bannedTerm) continue;
    const regex = buildTermRegex(term.bannedTerm);
    const matches = text.match(regex);
    if (matches && matches.length > 0) {
      messages.push(
        formatMessage(term.bannedTerm, term.preferredTerm, matches.length),
      );
    }
  }

  if (messages.length === 0) return true;
  return messages.join("; ");
}

// ── Validation rules ───────────────────────────────────────────

/**
 * Create a custom validator that scans for banned terms of a given severity.
 */
function makeValidator(
  fieldType: "string" | "text" | "pt",
  severity: "error" | "warning",
): CustomValidator {
  return (value, context) => {
    const ctx = context as {
      getClient?: (opts: { apiVersion: string }) => SanityClient;
    };
    const client = ctx.getClient?.({ apiVersion: API_VERSION });
    if (client) ensureCache(client);

    let text: string;
    if (fieldType === "pt") {
      text = extractPortableText(value);
    } else if (typeof value === "string") {
      text = value;
    } else {
      return true;
    }

    if (!text.trim()) return true;
    return scanForSeverity(text, severity);
  };
}

/**
 * Create style guide validation rules for a field.
 *
 * Returns an array of Rule items to spread into the field's validation array.
 * Produces two rules: one for error-severity terms (blocks publish) and
 * one for warning-severity terms (shows warning, doesn't block).
 *
 * @param Rule - The Rule instance from Sanity's validation callback
 * @param fieldType - "string" for title, "text" for excerpt, "pt" for body (Portable Text)
 */
export function styleGuideRules<R extends RuleDef<R, any>>(
  Rule: R,
  fieldType: "string" | "text" | "pt",
): R[] {
  // Error-severity rule — blocks publish
  const errorRule = Rule.custom(makeValidator(fieldType, "error"));

  // Warning-severity rule — shows warning, doesn't block
  const warningRule = Rule.custom(makeValidator(fieldType, "warning")).warning();

  return [errorRule, warningRule];
}
