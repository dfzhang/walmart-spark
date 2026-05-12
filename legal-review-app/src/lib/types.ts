/** Workflow states from sanity-plugin-workflow */
export type WorkflowState =
  | "inReview"
  | "pendingLegalReview"
  | "changesRequested"
  | "approved";

/** Workflow metadata document (managed by sanity-plugin-workflow) */
export interface WorkflowMetadata {
  _id: string;
  _type: string;
  _rev: string;
  state: WorkflowState;
  documentId: string;
}

/** Approval log entry stored on article documents */
export interface ApprovalLogEntry {
  _key: string;
  stage: string;
  action: "approved" | "changesRequested";
  userId: string;
  userName: string;
  timestamp: string;
  comment?: string;
  documentRevision: string;
}

/** Article document (partial — fields we need) */
export interface ArticleDocument {
  _id: string;
  _type: "article";
  _rev: string;
  _updatedAt: string;
  _createdAt: string;
  title: string;
  slug: { current: string };
  excerpt?: string;
  body?: PortableTextBlock[];
  approvalLog?: ApprovalLogEntry[];
  legalReviewNeeded?: boolean;
}

/** Portable Text block (simplified for diffing) */
export interface PortableTextBlock {
  _key: string;
  _type: string;
  style?: string;
  children?: PortableTextSpan[];
  markDefs?: MarkDef[];
  [key: string]: unknown;
}

export interface PortableTextSpan {
  _key: string;
  _type: "span";
  text: string;
  marks?: string[];
}

export interface MarkDef {
  _key: string;
  _type: string;
  [key: string]: unknown;
}

/** Queue item — article joined with workflow state */
export interface QueueItem {
  documentId: string;
  title: string;
  slug: string;
  updatedAt: string;
  workflowState: WorkflowState;
  lastApproval?: ApprovalLogEntry;
}

/** Diff result for a single PT block */
export type BlockDiff =
  | { type: "added"; block: PortableTextBlock }
  | { type: "deleted"; block: PortableTextBlock }
  | {
      type: "modified";
      oldBlock: PortableTextBlock;
      newBlock: PortableTextBlock;
      wordDiffs: WordDiff[];
    }
  | { type: "unchanged"; block: PortableTextBlock };

export interface WordDiff {
  value: string;
  added?: boolean;
  removed?: boolean;
}
