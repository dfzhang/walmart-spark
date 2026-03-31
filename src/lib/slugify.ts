/**
 * Convert a heading string to a URL-safe slug for anchor IDs.
 * Lowercase, strip special chars, hyphenate spaces, dedupe hyphens.
 *
 * "Getting Started" → "getting-started"
 * "How do I sign up?" → "how-do-i-sign-up"
 * "Earnings & Pay" → "earnings-pay"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // strip special chars
    .replace(/[\s_]+/g, "-") // spaces/underscores → hyphens
    .replace(/-+/g, "-") // dedupe hyphens
    .replace(/^-|-$/g, ""); // trim leading/trailing hyphens
}
