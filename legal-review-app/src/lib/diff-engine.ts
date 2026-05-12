import { diffWords } from "diff";
import type {
  PortableTextBlock,
  PortableTextSpan,
  BlockDiff,
  WordDiff,
} from "./types";

/**
 * Extract plain text from a single Portable Text block.
 * Concatenates all span text children.
 */
export function blockToPlainText(block: PortableTextBlock): string {
  if (!block.children) return "";
  return block.children
    .filter((child): child is PortableTextSpan => child._type === "span")
    .map((span) => span.text)
    .join("");
}

/**
 * Extract plain text from an array of Portable Text blocks.
 */
export function blocksToPlainText(blocks: PortableTextBlock[]): string {
  return blocks.map(blockToPlainText).join("\n\n");
}

/**
 * Compare two arrays of Portable Text blocks.
 * Uses `_key` as stable block identity for matching.
 * Falls back to word-level diff via the `diff` package.
 *
 * Returns an ordered array of BlockDiff results following
 * the new document's block order, with deleted blocks appended.
 */
export function diffPortableText(
  oldBlocks: PortableTextBlock[],
  newBlocks: PortableTextBlock[]
): BlockDiff[] {
  const oldMap = new Map(oldBlocks.map((b) => [b._key, b]));
  const newMap = new Map(newBlocks.map((b) => [b._key, b]));
  const results: BlockDiff[] = [];

  // Walk new blocks in order — detect added, modified, unchanged
  for (const newBlock of newBlocks) {
    const oldBlock = oldMap.get(newBlock._key);

    if (!oldBlock) {
      results.push({ type: "added", block: newBlock });
      continue;
    }

    const oldText = blockToPlainText(oldBlock);
    const newText = blockToPlainText(newBlock);

    if (oldText === newText) {
      results.push({ type: "unchanged", block: newBlock });
    } else {
      const wordDiffs = diffWords(oldText, newText).map(
        (part): WordDiff => ({
          value: part.value,
          added: part.added || undefined,
          removed: part.removed || undefined,
        })
      );
      results.push({
        type: "modified",
        oldBlock,
        newBlock,
        wordDiffs,
      });
    }
  }

  // Deleted blocks — in old but not in new
  for (const oldBlock of oldBlocks) {
    if (!newMap.has(oldBlock._key)) {
      results.push({ type: "deleted", block: oldBlock });
    }
  }

  return results;
}

/**
 * Compute summary stats from a diff result.
 */
export function diffStats(diffs: BlockDiff[]): {
  added: number;
  deleted: number;
  modified: number;
  unchanged: number;
} {
  return diffs.reduce(
    (acc, d) => {
      acc[d.type]++;
      return acc;
    },
    { added: 0, deleted: 0, modified: 0, unchanged: 0 }
  );
}
