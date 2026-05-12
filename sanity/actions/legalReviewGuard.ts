/**
 * Legal Review Workflow Guard
 *
 * Controls which workflow transitions are available based on the
 * article's `legalReviewNeeded` flag, current workflow state, and
 * user role. Implements the full transition policy matrix:
 *
 * 1. needsLegal && state ≠ pendingLegalReview:
 *    Hide "Approved", show "Pending Legal Review" (any editor can send to legal)
 *
 * 2. needsLegal && state = pendingLegalReview && hasLegalRole:
 *    Show "Approved" (legal reviewer approves), hide "Pending Legal Review"
 *
 * 3. needsLegal && state = pendingLegalReview && !hasLegalRole:
 *    Hide "Approved", hide "Pending Legal Review" (can only do "Changes Requested")
 *
 * 4. !needsLegal:
 *    Show "Approved", hide "Pending Legal Review" (normal path)
 *
 * Non-article types pass through unchanged.
 *
 * States define topology. This guard defines policy.
 *
 * Approval logging: When a legal reviewer approves or requests changes
 * from the pendingLegalReview state, an entry is appended to the
 * article's `approvalLog` array before the workflow transition fires.
 */
import {
  type DocumentActionComponent,
  type DocumentActionProps,
  type DocumentActionDescription,
  useClient,
  useCurrentUser,
  getPublishedId,
} from "sanity";
import { useEffect, useState, useCallback } from "react";

const API_VERSION = "2024-01-01";
const LEGAL_ROLES = ["legal", "administrator"];
const LOGGED_ACTIONS = ["Approved", "Changes Requested"] as const;

type LoggedActionLabel = (typeof LOGGED_ACTIONS)[number];

function actionLabelToLogAction(
  label: LoggedActionLabel,
): "approved" | "changesRequested" {
  return label === "Approved" ? "approved" : "changesRequested";
}

/**
 * Hook to read the current workflow state for a document.
 * Subscribes to real-time updates via the Sanity client listener.
 */
function useWorkflowState(documentId: string): string | null {
  const client = useClient({ apiVersion: API_VERSION });
  const publishedId = getPublishedId(documentId);
  const metadataId = `workflow-metadata.${publishedId}`;
  const [state, setState] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch
    client
      .fetch<{ state?: string } | null>(
        `*[_id == $id][0]{ state }`,
        { id: metadataId },
      )
      .then((doc) => setState(doc?.state ?? null))
      .catch(() => setState(null));

    // Subscribe to changes
    const subscription = client
      .listen<{ state?: string }>(
        `*[_id == $id]`,
        { id: metadataId },
        { includeResult: true },
      )
      .subscribe((update) => {
        if (update.type === "mutation" && update.result) {
          setState(update.result.state ?? null);
        }
      });

    return () => subscription.unsubscribe();
  }, [client, metadataId]);

  return state;
}

/**
 * Wraps a single workflow action component. Conditionally hides
 * transitions based on the full policy matrix, and intercepts
 * onHandle to append approval log entries for legal actions.
 */
function createLegalGuardedAction(
  originalAction: DocumentActionComponent,
): DocumentActionComponent {
  const GuardedAction = (
    props: DocumentActionProps,
  ): DocumentActionDescription | null => {
    const result = originalAction(props);
    const workflowState = useWorkflowState(props.id);
    const currentUser = useCurrentUser();
    const client = useClient({ apiVersion: API_VERSION });

    const appendApprovalLog = useCallback(
      async (label: LoggedActionLabel) => {
        const doc = props.draft || props.published;
        const publishedId = getPublishedId(props.id);
        const entry = {
          _key: crypto.randomUUID(),
          stage: "legal",
          action: actionLabelToLogAction(label),
          userId: currentUser?.id ?? "unknown",
          userName: currentUser?.name ?? "Unknown User",
          timestamp: new Date().toISOString(),
          comment: "",
          documentRevision: (doc as any)?._rev ?? "",
        };

        await client
          .patch(publishedId)
          .setIfMissing({ approvalLog: [] })
          .append("approvalLog", [entry])
          .commit();
      },
      [client, props.id, props.draft, props.published, currentUser],
    );

    // Action returned null — pass through
    if (!result) return null;

    // Only filter workflow transition actions
    const label = result.label;
    if (label !== "Approved" && label !== "Pending Legal Review" && label !== "Changes Requested") {
      return result;
    }

    // Read legalReviewNeeded from the document
    const doc = (props.draft || props.published) as
      | { legalReviewNeeded?: boolean }
      | undefined;
    const needsLegal = doc?.legalReviewNeeded === true;

    /**
     * Wraps onHandle to append an approval log entry before the
     * original workflow transition fires. Only applied to "Approved"
     * and "Changes Requested" actions in the pendingLegalReview state.
     */
    function withApprovalLog(
      action: DocumentActionDescription,
      actionLabel: LoggedActionLabel,
    ): DocumentActionDescription {
      const originalOnHandle = action.onHandle;
      return {
        ...action,
        onHandle: async () => {
          await appendApprovalLog(actionLabel);
          originalOnHandle?.();
        },
      };
    }

    if (!needsLegal) {
      // Case 4: Normal articles — hide "Pending Legal Review", show "Approved"
      if (label === "Pending Legal Review") return null;
      return result;
    }

    // Document needs legal review
    if (workflowState === "pendingLegalReview") {
      // Cases 2 & 3: Document is in legal review
      if (label === "Pending Legal Review") return null;

      if (label === "Changes Requested") {
        // Log changes-requested from any user in PLR state
        return withApprovalLog(result, "Changes Requested");
      }

      // "Approved" — only legal/admin can approve
      const userRoles = currentUser?.roles?.map((r) => r.name) ?? [];
      const hasLegalRole = userRoles.some((role) => LEGAL_ROLES.includes(role));

      if (!hasLegalRole) {
        // Case 3: Non-legal user — disable with explanation
        return {
          ...result,
          disabled: true,
          title:
            'Only users with the "legal" or "administrator" role can approve articles requiring legal review.',
        };
      }
      // Case 2: Legal user — log and approve
      return withApprovalLog(result, "Approved");
    } else {
      // Case 1: Not yet in legal review — hide "Approved", show "Pending Legal Review"
      if (label === "Approved") return null;
      return result;
    }
  };

  GuardedAction.displayName = `LegalGuard(${originalAction.displayName || originalAction.name || "Action"})`;
  // Preserve static properties (e.g. .action = "publish") through the wrapping chain
  (GuardedAction as any).action = (originalAction as any).action;

  return GuardedAction;
}

/**
 * Document actions resolver. Wraps workflow actions for articles
 * to conditionally show/hide legal review transitions.
 * Non-article types pass through unchanged.
 *
 * Must be applied AFTER the workflow plugin in the config so that
 * workflow actions are already in the `prev` array.
 */
export function legalReviewActions(
  prev: DocumentActionComponent[],
  context: { schemaType: string },
): DocumentActionComponent[] {
  if (context.schemaType !== "article") return prev;

  return prev.map((action) => createLegalGuardedAction(action));
}
