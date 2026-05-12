import { blockToPlainText } from "../lib/diff-engine";
import type { BlockDiff, WordDiff } from "../lib/types";

interface TrackChangesProps {
  diffs: BlockDiff[];
}

/**
 * Renders Portable Text diffs in a Word-like track changes view.
 * - Green underline = insertions
 * - Red strikethrough = deletions
 * - Green left border = new blocks
 * - Red left border = deleted blocks
 */
export function TrackChanges({ diffs }: TrackChangesProps) {
  if (diffs.length === 0) {
    return <p className="track-changes__empty">No content to compare.</p>;
  }

  return (
    <div className="track-changes" role="region" aria-label="Content changes">
      {diffs.map((diff, i) => {
        const key = diff.type === "modified"
          ? diff.newBlock._key
          : diff.block._key;
        return (
          <DiffBlock key={diff.type === "deleted" ? `del-${key}` : key} diff={diff} index={i} />
        );
      })}
    </div>
  );
}

function DiffBlock({ diff }: { diff: BlockDiff; index: number }) {
  const block = diff.type === "modified" ? diff.newBlock : diff.block;
  const style = block.style;
  const Tag = getHeadingTag(style);

  switch (diff.type) {
    case "unchanged":
      return (
        <Tag className="diff-block diff-block--unchanged">
          {blockToPlainText(diff.block)}
        </Tag>
      );

    case "added":
      return (
        <Tag className="diff-block diff-block--added" aria-label="New content">
          <span className="diff-marker">+ NEW</span>
          {blockToPlainText(diff.block)}
        </Tag>
      );

    case "deleted":
      return (
        <Tag className="diff-block diff-block--deleted" aria-label="Deleted content">
          <span className="diff-marker">− REMOVED</span>
          <del>{blockToPlainText(diff.block)}</del>
        </Tag>
      );

    case "modified":
      return (
        <Tag className="diff-block diff-block--modified">
          {diff.wordDiffs.map((part, j) => (
            <WordDiffSpan key={j} part={part} />
          ))}
        </Tag>
      );
  }
}

function WordDiffSpan({ part }: { part: WordDiff }) {
  if (part.added) {
    return (
      <ins className="word-added" aria-label="Added text">
        {part.value}
      </ins>
    );
  }
  if (part.removed) {
    return (
      <del className="word-removed" aria-label="Removed text">
        {part.value}
      </del>
    );
  }
  return <span>{part.value}</span>;
}

function getHeadingTag(
  style?: string
): "p" | "h2" | "h3" | "h4" {
  switch (style) {
    case "h2":
      return "h2";
    case "h3":
      return "h3";
    case "h4":
      return "h4";
    default:
      return "p";
  }
}
