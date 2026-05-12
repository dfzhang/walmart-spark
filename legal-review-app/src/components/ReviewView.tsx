import { useQuery } from "@sanity/sdk-react";
import { useState, useEffect, useCallback } from "react";
import { TrackChanges } from "./TrackChanges";
import { ApprovalHistory } from "./ApprovalHistory";
import { ExportButton } from "./ExportButton";
import { diffPortableText, diffStats } from "../lib/diff-engine";
import {
  fetchDocumentAtRevision,
  mutate,
  groqQuery,
} from "../lib/sanity-client";
import type {
  ArticleDocument,
  ApprovalLogEntry,
  BlockDiff,
  PortableTextBlock,
} from "../lib/types";

interface ReviewViewProps {
  documentId: string;
  documentType: string;
  onBack: () => void;
}

/** Fetch the current article with its approval log */
const ARTICLE_QUERY = `*[_id == $id || _id == "drafts." + $id] | order(_id asc) [0] {
  _id, _rev, _type, _updatedAt, _createdAt,
  title, slug, excerpt, body, approvalLog, legalReviewNeeded
}`;

/** Fetch the workflow metadata for this document */
const WORKFLOW_QUERY = `*[_id == "workflow-metadata." + $id][0] {
  _id, state
}`;

export function ReviewView({
  documentId,
  documentType,
  onBack,
}: ReviewViewProps) {
  const { data: article } = useQuery<ArticleDocument | null>({
    query: ARTICLE_QUERY,
    params: { id: documentId },
  });

  const { data: workflow } = useQuery<{ _id: string; state: string } | null>({
    query: WORKFLOW_QUERY,
    params: { id: documentId },
  });

  const [diffs, setDiffs] = useState<BlockDiff[] | null>(null);
  const [diffError, setDiffError] = useState<string | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  // Compute diff when article loads
  useEffect(() => {
    if (!article?.body) return;

    const lastApproval = article.approvalLog
      ?.filter((e) => e.action === "approved")
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];

    if (!lastApproval?.documentRevision) {
      // No previous approval — everything is "new"
      setDiffs(
        article.body.map((block) => ({
          type: "added" as const,
          block,
        }))
      );
      return;
    }

    let cancelled = false;
    setDiffLoading(true);
    setDiffError(null);

    fetchDocumentAtRevision<ArticleDocument>(
      documentId,
      lastApproval.documentRevision
    )
      .then((oldDoc) => {
        if (cancelled) return;
        const oldBody = oldDoc?.body ?? [];
        const newBody = article.body ?? [];
        setDiffs(diffPortableText(oldBody, newBody));
      })
      .catch((err) => {
        if (cancelled) return;
        setDiffError(
          `Failed to load previous version: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      })
      .finally(() => {
        if (!cancelled) setDiffLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [article, documentId]);

  const handleApprove = useCallback(async () => {
    if (!article) return;
    setActionLoading(true);
    setActionMessage(null);

    try {
      // Get current user info from the SDK app session
      const currentUser = await groqQuery<{ id: string; name: string }>(
        `*[_type == "system.user" && _id == $userId][0]{ "id": _id, "name": name }`,
        {}
      ).catch(() => ({ id: "unknown", name: "Legal Reviewer" }));

      const metadataId = `workflow-metadata.${documentId}`;
      const logEntry: Omit<ApprovalLogEntry, "_key"> & { _key: string } = {
        _key: crypto.randomUUID().slice(0, 8),
        stage: "legal",
        action: "approved",
        userId: currentUser.id,
        userName: currentUser.name,
        timestamp: new Date().toISOString(),
        comment: comment || undefined,
        documentRevision: article._rev,
      };

      await mutate([
        {
          patch: {
            id: metadataId,
            set: { state: "approved" },
          },
        },
        {
          patch: {
            id: article._id,
            setIfMissing: { approvalLog: [] },
            insert: {
              after: "approvalLog[-1]",
              items: [logEntry],
            },
          },
        },
      ]);

      setActionMessage("✅ Document approved successfully.");
      setComment("");
    } catch (err) {
      setActionMessage(
        `❌ Failed to approve: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setActionLoading(false);
    }
  }, [article, documentId, comment]);

  const handleRequestChanges = useCallback(async () => {
    if (!article || !comment.trim()) {
      setActionMessage("❌ Please provide a comment explaining the requested changes.");
      return;
    }
    setActionLoading(true);
    setActionMessage(null);

    try {
      const currentUser = await groqQuery<{ id: string; name: string }>(
        `*[_type == "system.user" && _id == $userId][0]{ "id": _id, "name": name }`,
        {}
      ).catch(() => ({ id: "unknown", name: "Legal Reviewer" }));

      const metadataId = `workflow-metadata.${documentId}`;
      const logEntry: Omit<ApprovalLogEntry, "_key"> & { _key: string } = {
        _key: crypto.randomUUID().slice(0, 8),
        stage: "legal",
        action: "changesRequested",
        userId: currentUser.id,
        userName: currentUser.name,
        timestamp: new Date().toISOString(),
        comment: comment,
        documentRevision: article._rev,
      };

      await mutate([
        {
          patch: {
            id: metadataId,
            set: { state: "changesRequested" },
          },
        },
        {
          patch: {
            id: article._id,
            setIfMissing: { approvalLog: [] },
            insert: {
              after: "approvalLog[-1]",
              items: [logEntry],
            },
          },
        },
      ]);

      setActionMessage("✅ Changes requested. Document returned to author.");
      setComment("");
    } catch (err) {
      setActionMessage(
        `❌ Failed to request changes: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setActionLoading(false);
    }
  }, [article, documentId, comment]);

  if (!article) {
    return (
      <div className="review-view">
        <button className="back-button" onClick={onBack} type="button">
          ← Back to Dashboard
        </button>
        <p className="review-view__error">Document not found.</p>
      </div>
    );
  }

  const stats = diffs ? diffStats(diffs) : null;
  const isPending = workflow?.state === "pendingLegalReview";

  return (
    <div className="review-view">
      <button className="back-button" onClick={onBack} type="button">
        ← Back to Dashboard
      </button>

      <div className="review-header">
        <h2 className="review-header__title">📄 {article.title}</h2>
        <div className="review-header__meta">
          <span>
            Status:{" "}
            <strong>
              {workflow?.state === "pendingLegalReview"
                ? "Pending Legal Review"
                : workflow?.state === "approved"
                  ? "Approved"
                  : workflow?.state === "changesRequested"
                    ? "Changes Requested"
                    : workflow?.state ?? "Unknown"}
            </strong>
          </span>
          <span>Last updated: {formatDate(article._updatedAt)}</span>
          {stats && (
            <span className="review-header__stats">
              {stats.added > 0 && (
                <span className="stat stat--added">+{stats.added} new</span>
              )}
              {stats.deleted > 0 && (
                <span className="stat stat--deleted">
                  −{stats.deleted} removed
                </span>
              )}
              {stats.modified > 0 && (
                <span className="stat stat--modified">
                  ~{stats.modified} modified
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Track Changes */}
      <section className="review-section">
        <h3>Content Changes</h3>
        {diffLoading ? (
          <div className="loading-spinner" role="status">
            <div className="spinner" />
            <span>Computing changes…</span>
          </div>
        ) : diffError ? (
          <p className="review-view__error">{diffError}</p>
        ) : diffs ? (
          <TrackChanges diffs={diffs} />
        ) : null}
      </section>

      {/* Approval History */}
      <section className="review-section">
        <h3>Approval History</h3>
        <ApprovalHistory entries={article.approvalLog ?? []} />
      </section>

      {/* Actions */}
      {isPending && (
        <section className="review-section review-actions">
          <h3>Review Decision</h3>
          <div className="review-actions__comment">
            <label htmlFor="review-comment">
              Comment {workflow?.state === "pendingLegalReview" && "(required for changes requested)"}
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment about your review decision…"
              rows={3}
            />
          </div>
          <div className="review-actions__buttons">
            <button
              className="btn btn--approve"
              onClick={handleApprove}
              disabled={actionLoading}
              type="button"
            >
              ✅ Approve
            </button>
            <button
              className="btn btn--reject"
              onClick={handleRequestChanges}
              disabled={actionLoading}
              type="button"
            >
              ❌ Request Changes
            </button>
            {diffs && (
              <ExportButton
                title={article.title}
                diffs={diffs}
              />
            )}
          </div>
          {actionMessage && (
            <p
              className={`review-actions__message ${actionMessage.startsWith("✅") ? "review-actions__message--success" : "review-actions__message--error"}`}
              role="status"
            >
              {actionMessage}
            </p>
          )}
        </section>
      )}

      {/* Export for non-pending states */}
      {!isPending && diffs && (
        <section className="review-section">
          <ExportButton title={article.title} diffs={diffs} />
        </section>
      )}
    </div>
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
