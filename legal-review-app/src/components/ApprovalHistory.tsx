import type { ApprovalLogEntry } from "../lib/types";

interface ApprovalHistoryProps {
  entries: ApprovalLogEntry[];
}

/**
 * Renders the approval log as a timeline.
 * Most recent entries first.
 */
export function ApprovalHistory({ entries }: ApprovalHistoryProps) {
  if (entries.length === 0) {
    return (
      <p className="approval-history__empty">
        No approval history yet. This document hasn't been reviewed.
      </p>
    );
  }

  const sorted = [...entries].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <ol className="approval-history" role="list" aria-label="Approval history">
      {sorted.map((entry) => (
        <li
          key={entry._key || entry.timestamp}
          className={`approval-entry approval-entry--${entry.action}`}
        >
          <div className="approval-entry__icon">
            {entry.action === "approved" ? "✅" : "❌"}
          </div>
          <div className="approval-entry__content">
            <div className="approval-entry__header">
              <strong>
                {entry.action === "approved"
                  ? "Approved"
                  : "Changes Requested"}
              </strong>
              <span className="approval-entry__meta">
                by {entry.userName} · {formatDate(entry.timestamp)}
              </span>
            </div>
            {entry.comment && (
              <blockquote className="approval-entry__comment">
                {entry.comment}
              </blockquote>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
