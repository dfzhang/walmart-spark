export const PROJECT_ID = "o01w1nx2";
export const DATASET = "production";
export const API_VERSION = "2024-01-01";

/** Labels for workflow states */
export const STATE_LABELS: Record<string, string> = {
  inReview: "In Review",
  pendingLegalReview: "Pending Legal Review",
  changesRequested: "Changes Requested",
  approved: "Approved",
};

/** Icons for workflow states */
export const STATE_ICONS: Record<string, string> = {
  inReview: "📝",
  pendingLegalReview: "📋",
  changesRequested: "❌",
  approved: "✅",
};
