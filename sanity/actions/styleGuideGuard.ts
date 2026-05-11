/**
 * Style Guide Publish Guard
 *
 * Wraps the Publish action to check article content against glossaryTerm
 * documents before publishing. Violations are shown in a dialog:
 *
 * - Error violations → block publish entirely (dialog with close only)
 * - Warning violations only → confirm dialog with "Publish Anyway" option
 * - No violations → publish normally (no dialog)
 *
 * Composes with legalReviewActions:
 *   actions: (prev, ctx) => withStyleGuideGuard(legalReviewActions(prev, ctx), ctx)
 */
import {
  type DocumentActionComponent,
  type DocumentActionProps,
  type DocumentActionDescription,
  useClient,
} from "sanity";
import { toPlainText } from "@portabletext/toolkit";
import { useEffect, useState, useCallback } from "react";
import { createElement } from "react";

const API_VERSION = "2024-01-01";

// ── Types ──────────────────────────────────────────────────────

interface GlossaryTerm {
  _id: string;
  bannedTerm: string;
  preferredTerm: string | null;
  severity: "error" | "warning";
}

interface Violation {
  term: string;
  preferred: string | null;
  severity: "error" | "warning";
  count: number;
  fieldName: string;
}

// ── Hooks ──────────────────────────────────────────────────────

/**
 * Fetches all glossaryTerm documents and subscribes to real-time updates.
 */
function useGlossaryTerms(): GlossaryTerm[] {
  const client = useClient({ apiVersion: API_VERSION });
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);

  useEffect(() => {
    const query = `*[_type == "glossaryTerm"]{ _id, bannedTerm, preferredTerm, severity }`;

    client
      .fetch<GlossaryTerm[]>(query)
      .then(setTerms)
      .catch(() => setTerms([]));

    const subscription = client
      .listen(query, {}, { includeResult: true })
      .subscribe(() => {
        // Re-fetch on any change to glossaryTerm documents
        client
          .fetch<GlossaryTerm[]>(query)
          .then(setTerms)
          .catch(() => setTerms([]));
      });

    return () => subscription.unsubscribe();
  }, [client]);

  return terms;
}

// ── Text extraction ────────────────────────────────────────────

/**
 * Extract plain text from a Portable Text array.
 * Handles block-level content only — skips images, code blocks, etc.
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

/**
 * Extract all scannable text fields from a document.
 * Returns an array of { fieldName, text } pairs.
 */
function extractTextFields(
  doc: Record<string, unknown>,
): Array<{ fieldName: string; text: string }> {
  const fields: Array<{ fieldName: string; text: string }> = [];

  if (typeof doc.title === "string" && doc.title.trim()) {
    fields.push({ fieldName: "Title", text: doc.title });
  }

  if (typeof doc.excerpt === "string" && doc.excerpt.trim()) {
    fields.push({ fieldName: "Excerpt", text: doc.excerpt });
  }

  const bodyText = extractPortableText(doc.body);
  if (bodyText.trim()) {
    fields.push({ fieldName: "Body", text: bodyText });
  }

  return fields;
}

// ── Matching ───────────────────────────────────────────────────

/**
 * Build a regex for a banned term. Uses word boundaries for matching.
 * Handles apostrophes and multi-word phrases correctly.
 */
function buildTermRegex(bannedTerm: string): RegExp {
  const escaped = bannedTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "gi");
}

/**
 * Check all text fields against all glossary terms.
 * Returns violations sorted by severity (errors first), then by field.
 */
function findViolations(
  textFields: Array<{ fieldName: string; text: string }>,
  terms: GlossaryTerm[],
): Violation[] {
  const violations: Violation[] = [];

  for (const term of terms) {
    if (!term.bannedTerm) continue;
    const regex = buildTermRegex(term.bannedTerm);

    for (const field of textFields) {
      const matches = field.text.match(regex);
      if (matches && matches.length > 0) {
        violations.push({
          term: term.bannedTerm,
          preferred: term.preferredTerm,
          severity: term.severity,
          count: matches.length,
          fieldName: field.fieldName,
        });
      }
    }
  }

  // Sort: errors first, then alphabetically by term
  return violations.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "error" ? -1 : 1;
    return a.term.localeCompare(b.term);
  });
}

// ── Dialog content ─────────────────────────────────────────────

function ViolationTable({
  violations,
  color,
}: {
  violations: Violation[];
  color: string;
}) {
  return createElement(
    "table",
    {
      style: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "13px",
        marginBottom: "12px",
      },
    },
    createElement(
      "thead",
      null,
      createElement(
        "tr",
        { style: { borderBottom: "2px solid #ddd" } },
        createElement(
          "th",
          { style: { textAlign: "left", padding: "6px 8px" } },
          "Field",
        ),
        createElement(
          "th",
          { style: { textAlign: "left", padding: "6px 8px" } },
          "Banned Term",
        ),
        createElement(
          "th",
          { style: { textAlign: "left", padding: "6px 8px" } },
          "Use Instead",
        ),
        createElement(
          "th",
          { style: { textAlign: "right", padding: "6px 8px" } },
          "Count",
        ),
      ),
    ),
    createElement(
      "tbody",
      null,
      ...violations.map((v, i) =>
        createElement(
          "tr",
          {
            key: `${v.fieldName}-${v.term}-${i}`,
            style: { borderBottom: "1px solid #f0f0f0" },
          },
          createElement(
            "td",
            { style: { padding: "6px 8px" } },
            v.fieldName,
          ),
          createElement(
            "td",
            {
              style: { padding: "6px 8px", fontWeight: "bold", color },
            },
            v.term,
          ),
          createElement(
            "td",
            {
              style: {
                padding: "6px 8px",
                fontStyle: v.preferred ? "normal" : "italic",
              },
            },
            v.preferred || "(remove reference)",
          ),
          createElement(
            "td",
            { style: { padding: "6px 8px", textAlign: "right" } },
            String(v.count),
          ),
        ),
      ),
    ),
  );
}

function ViolationReport({ violations }: { violations: Violation[] }) {
  const errors = violations.filter((v) => v.severity === "error");
  const warnings = violations.filter((v) => v.severity === "warning");

  return createElement(
    "div",
    { style: { padding: "8px 0" } },
    errors.length > 0 &&
      createElement(
        "div",
        { style: { marginBottom: "16px" } },
        createElement(
          "h4",
          {
            style: {
              color: "#d32f2f",
              margin: "0 0 8px 0",
              fontSize: "14px",
            },
          },
          `🚫 ${errors.length} Error${errors.length > 1 ? "s" : ""} — must fix before publishing`,
        ),
        createElement(ViolationTable, {
          violations: errors,
          color: "#d32f2f",
        }),
      ),
    warnings.length > 0 &&
      createElement(
        "div",
        null,
        createElement(
          "h4",
          {
            style: {
              color: "#ed6c02",
              margin: "0 0 8px 0",
              fontSize: "14px",
            },
          },
          `⚠️ ${warnings.length} Warning${warnings.length > 1 ? "s" : ""} — review recommended`,
        ),
        createElement(ViolationTable, {
          violations: warnings,
          color: "#ed6c02",
        }),
      ),
  );
}

// ── Action wrapper ─────────────────────────────────────────────

function createStyleGuardedPublish(
  originalAction: DocumentActionComponent,
): DocumentActionComponent {
  const GuardedPublish = (
    props: DocumentActionProps,
  ): DocumentActionDescription | null => {
    const result = originalAction(props);
    const terms = useGlossaryTerms();
    const [dialogState, setDialogState] = useState<{
      violations: Violation[];
      hasErrors: boolean;
    } | null>(null);

    const handlePublish = useCallback(() => {
      if (!result?.onHandle) return;

      const doc = (props.draft || props.published) as
        | Record<string, unknown>
        | undefined;
      if (!doc || terms.length === 0) {
        // No doc or no terms configured — publish normally
        result.onHandle();
        return;
      }

      const textFields = extractTextFields(doc);
      const found = findViolations(textFields, terms);

      if (found.length === 0) {
        // Clean — publish normally
        result.onHandle();
        return;
      }

      const hasErrors = found.some((v) => v.severity === "error");
      setDialogState({ violations: found, hasErrors });
    }, [result, props.draft, props.published, terms]);

    if (!result) return null;

    // Error violations → blocking dialog (close only)
    if (dialogState?.hasErrors) {
      return {
        ...result,
        label: "Style Guide Violations",
        dialog: {
          type: "dialog",
          header: "🚫 Style Guide — Publish Blocked",
          content: createElement(ViolationReport, {
            violations: dialogState.violations,
          }),
          onClose: () => setDialogState(null),
        },
      };
    }

    // Warning violations only → confirm dialog with "Publish Anyway"
    if (dialogState && !dialogState.hasErrors) {
      return {
        ...result,
        dialog: {
          type: "confirm",
          tone: "caution",
          message: createElement(ViolationReport, {
            violations: dialogState.violations,
          }),
          onConfirm: () => {
            setDialogState(null);
            result.onHandle?.();
          },
          onCancel: () => setDialogState(null),
          confirmButtonText: "Publish Anyway",
          cancelButtonText: "Go Back & Fix",
        },
      };
    }

    return {
      ...result,
      onHandle: handlePublish,
    };
  };

  GuardedPublish.displayName = `StyleGuideGuard(${originalAction.displayName || originalAction.name || "Publish"})`;
  // Preserve static properties (e.g. .action = "publish") through the wrapping chain
  (GuardedPublish as any).action = (originalAction as any).action;

  return GuardedPublish;
}

// ── Resolver ───────────────────────────────────────────────────

/**
 * Document actions resolver. Wraps the Publish action for articles
 * with the style guide violation check.
 *
 * Compose with legalReviewActions:
 *   document: {
 *     actions: (prev, ctx) => {
 *       const withLegal = legalReviewActions(prev, ctx);
 *       return withStyleGuideGuard(withLegal, ctx);
 *     }
 *   }
 */
export function withStyleGuideGuard(
  prev: DocumentActionComponent[],
  context: { schemaType: string },
): DocumentActionComponent[] {
  if (context.schemaType !== "article") return prev;

  return prev.map((action) => {
    // Identify the Publish action by its `action` property
    if ((action as unknown as { action?: string }).action === "publish") {
      return createStyleGuardedPublish(action);
    }
    return action;
  });
}
