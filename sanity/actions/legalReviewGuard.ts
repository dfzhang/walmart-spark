/**
 * Legal Review Workflow Guard
 *
 * Controls which workflow transitions are available based on the
 * article's `legalReviewNeeded` flag:
 *
 * - legalReviewNeeded == true:
 *   Hide direct "Approved" transition (must go through "Pending Legal Review")
 *   Show "Pending Legal Review" transition
 *
 * - legalReviewNeeded == false (or undefined):
 *   Hide "Pending Legal Review" transition (irrelevant for normal articles)
 *   Show direct "Approved" transition
 *
 * Non-article types pass through unchanged.
 */
import {
  type DocumentActionComponent,
  type DocumentActionProps,
  type DocumentActionDescription,
} from "sanity";

/**
 * Wraps a single workflow action component. Conditionally hides
 * transitions based on the article's legalReviewNeeded flag.
 */
function createLegalGuardedAction(
  originalAction: DocumentActionComponent,
): DocumentActionComponent {
  const GuardedAction = (
    props: DocumentActionProps,
  ): DocumentActionDescription | null => {
    const result = originalAction(props);

    // Action returned null — pass through
    if (!result) return null;

    // Only filter workflow transition actions (they have labels matching state titles)
    const label = result.label;
    if (label !== "Approved" && label !== "Pending Legal Review") return result;

    // Read legalReviewNeeded from the document
    const doc = (props.draft || props.published) as
      | { legalReviewNeeded?: boolean }
      | undefined;
    const needsLegal = doc?.legalReviewNeeded === true;

    if (needsLegal) {
      // Legal articles: hide direct "Approved" (must go through legal review)
      if (label === "Approved") return null;
      // Show "Pending Legal Review"
      return result;
    } else {
      // Normal articles: hide "Pending Legal Review" (irrelevant)
      if (label === "Pending Legal Review") return null;
      // Show direct "Approved"
      return result;
    }
  };

  GuardedAction.displayName = `LegalGuard(${originalAction.displayName || originalAction.name || "Action"})`;

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
