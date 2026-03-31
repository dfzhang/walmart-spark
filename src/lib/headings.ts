import type { PortableTextBlock } from "@portabletext/types";
import { slugify } from "./slugify";

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3 | 4;
  /** Portable Text block _key — used to map server IDs to client blocks */
  _key: string;
}

/**
 * Extract plain text from a Portable Text block's children spans.
 */
export function blockToPlainText(block: PortableTextBlock): string {
  const children = (block as { children?: { text?: string }[] }).children;
  if (!children) return "";
  return children.map((c) => c.text ?? "").join("");
}

/**
 * Extract headings (h2–h4) from a Portable Text body array.
 * Returns a flat list with id, text, and level for TOC rendering.
 *
 * Handles duplicate headings by appending a counter suffix.
 */
export function extractHeadings(body: PortableTextBlock[]): TocHeading[] {
  if (!body) return [];

  const seen = new Map<string, number>();

  return body
    .filter((block) => {
      const style = (block as { style?: string }).style;
      return style === "h2" || style === "h3" || style === "h4";
    })
    .map((block) => {
      const style = (block as { style?: string }).style as "h2" | "h3" | "h4";
      const text = blockToPlainText(block);
      let id = slugify(text);

      // Handle duplicate headings — append counter
      const count = seen.get(id) ?? 0;
      seen.set(id, count + 1);
      if (count > 0) {
        id = `${id}-${count}`;
      }

      const level = parseInt(style.charAt(1), 10) as 2 | 3 | 4;
      return { id, text, level, _key: block._key ?? "" };
    });
}

/**
 * Build a Map from Portable Text block _key → heading ID.
 * Pass this to ArticleBody so the client uses server-computed IDs
 * instead of recomputing (avoids hydration mismatch on duplicates).
 */
export function buildHeadingIdMap(headings: TocHeading[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const h of headings) {
    map.set(h._key, h.id);
  }
  return map;
}
