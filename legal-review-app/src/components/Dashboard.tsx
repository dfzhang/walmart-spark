import { useQuery } from "@sanity/sdk-react";
import { STATE_LABELS, STATE_ICONS } from "../lib/constants";
import type { QueueItem, WorkflowState } from "../lib/types";

interface DashboardProps {
  onSelectDocument: (documentId: string, documentType: string) => void;
}

/**
 * GROQ query that joins workflow-metadata docs with their article data.
 * Workflow plugin stores state in `workflow-metadata.{docId}` documents.
 */
const QUEUE_QUERY = `{
  "pending": *[_type == "workflow.metadata" && state == "pendingLegalReview"] {
    "documentId": string::split(_id, "workflow-metadata.")[1],
    state,
    _updatedAt
  },
  "approved": *[_type == "workflow.metadata" && state == "approved"] | order(_updatedAt desc) [0...10] {
    "documentId": string::split(_id, "workflow-metadata.")[1],
    state,
    _updatedAt
  },
  "changesRequested": *[_type == "workflow.metadata" && state == "changesRequested"] {
    "documentId": string::split(_id, "workflow-metadata.")[1],
    state,
    _updatedAt
  }
}`;

/**
 * Fetch article details for a list of document IDs.
 * Separate query because workflow-metadata doesn't store article fields.
 */
const ARTICLES_QUERY = `*[_type == "article" && _id in $ids] {
  _id, title, "slug": slug.current, _updatedAt,
  "lastApproval": *[_id == "approval-log." + ^._id][0].entries[action == "approved"] | order(timestamp desc) [0]
}`;

interface QueueData {
  pending: { documentId: string; state: WorkflowState; _updatedAt: string }[];
  approved: { documentId: string; state: WorkflowState; _updatedAt: string }[];
  changesRequested: {
    documentId: string;
    state: WorkflowState;
    _updatedAt: string;
  }[];
}

interface ArticleData {
  _id: string;
  title: string;
  slug: string;
  _updatedAt: string;
  lastApproval?: { timestamp: string; userName: string };
}

export function Dashboard({ onSelectDocument }: DashboardProps) {
  const { data: queue } = useQuery<QueueData>({ query: QUEUE_QUERY });

  // Collect all document IDs to fetch article details
  const allIds = [
    ...(queue?.pending ?? []),
    ...(queue?.approved ?? []),
    ...(queue?.changesRequested ?? []),
  ].map((item) => item.documentId);

  const { data: articles } = useQuery<ArticleData[]>({
    query: ARTICLES_QUERY,
    params: { ids: allIds.length > 0 ? allIds : ["__none__"] },
  });

  const articleMap = new Map(
    (articles ?? []).map((a) => [a._id, a])
  );

  function buildQueueItems(
    items: { documentId: string; state: WorkflowState }[]
  ): QueueItem[] {
    const result: QueueItem[] = [];
    for (const item of items) {
      const article = articleMap.get(item.documentId);
      if (!article) continue;
      result.push({
        documentId: item.documentId,
        title: article.title,
        slug: article.slug,
        updatedAt: article._updatedAt,
        workflowState: item.state,
        lastApproval: article.lastApproval as QueueItem["lastApproval"],
      });
    }
    return result;
  }

  const pendingItems = buildQueueItems(queue?.pending ?? []);
  const approvedItems = buildQueueItems(queue?.approved ?? []);
  const changesRequestedItems = buildQueueItems(
    queue?.changesRequested ?? []
  );

  return (
    <div className="dashboard">
      <QueueSection
        title="Pending Review"
        icon="📋"
        items={pendingItems}
        emptyMessage="No documents pending legal review"
        onSelect={onSelectDocument}
        highlight
      />
      <QueueSection
        title="Changes Requested"
        icon="❌"
        items={changesRequestedItems}
        emptyMessage="No documents with requested changes"
        onSelect={onSelectDocument}
      />
      <QueueSection
        title="Recently Approved"
        icon="✅"
        items={approvedItems}
        emptyMessage="No recently approved documents"
        onSelect={onSelectDocument}
      />
    </div>
  );
}

interface QueueSectionProps {
  title: string;
  icon: string;
  items: QueueItem[];
  emptyMessage: string;
  onSelect: (documentId: string, documentType: string) => void;
  highlight?: boolean;
}

function QueueSection({
  title,
  icon,
  items,
  emptyMessage,
  onSelect,
  highlight,
}: QueueSectionProps) {
  return (
    <section className={`queue-section ${highlight ? "queue-section--highlight" : ""}`}>
      <h2 className="queue-section__title">
        {icon} {title} ({items.length})
      </h2>
      {items.length === 0 ? (
        <p className="queue-section__empty">{emptyMessage}</p>
      ) : (
        <ul className="queue-list" role="list">
          {items.map((item) => (
            <li key={item.documentId} className="queue-item">
              <button
                className="queue-item__button"
                onClick={() => onSelect(item.documentId, "article")}
                type="button"
              >
                <div className="queue-item__header">
                  <span className="queue-item__title">
                    📄 {item.title}
                  </span>
                  <span className="queue-item__state">
                    {STATE_ICONS[item.workflowState]}{" "}
                    {STATE_LABELS[item.workflowState]}
                  </span>
                </div>
                <div className="queue-item__meta">
                  <span>Updated {formatRelativeDate(item.updatedAt)}</span>
                  {item.lastApproval && (
                    <span>
                      Last approved by {item.lastApproval.userName}{" "}
                      on {formatDate(item.lastApproval.timestamp)}
                    </span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(iso);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
