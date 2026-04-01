/**
 * Legal Review Workflow Guard
 *
 * Wraps the workflow plugin's "Approved" action for articles.
 * When `legalReviewNeeded` is true on an article, the Approved
 * transition is disabled unless the current user has the
 * `legal-reviewer` or `administrator` role.
 *
 * Non-article types and articles with `legalReviewNeeded == false`
 * pass through unchanged.
 */
import {
  type DocumentActionComponent,
  type DocumentActionProps,
  type DocumentActionDescription,
  useCurrentUser,
} from "sanity";

const LEGAL_ROLES = ["legal-reviewer", "administrator"];

/**
 * Wraps a single workflow action component. If the action's label
 * is "Approved" and the document requires legal review, disables
 * the action for users without the required role.
 */
function createLegalGuardedAction(
  originalAction: DocumentActionComponent,
): DocumentActionComponent {
  const GuardedAction = (
    props: DocumentActionProps,
  ): DocumentActionDescription | null => {
    const result = originalAction(props);
    const currentUser = useCurrentUser();

    // Action returned null (e.g. not in workflow) — pass through
    if (!result) return null;

    // Only gate the "Approved" action
    if (result.label !== "Approved") return result;

    // Check if this article requires legal review
    const doc = (props.draft || props.published) as
      | { legalReviewNeeded?: boolean }
      | undefined;
    const needsLegal = doc?.legalReviewNeeded === true;

    if (!needsLegal) return result;

    // Check if user has a legal role
    const userRoles = currentUser?.roles?.map((r) => r.name) ?? [];
    const hasLegalRole = userRoles.some((role) => LEGAL_ROLES.includes(role));

    if (hasLegalRole) return result;

    // User lacks legal role — disable the action with explanation
    return {
      ...result,
      disabled: true,
      title:
        'This article requires legal review. Only users with the "legal-reviewer" or "administrator" role can approve it.',
    };
  };

  // Preserve the original action identity for Sanity's internal tracking
  GuardedAction.displayName = `LegalGuard(${originalAction.displayName || originalAction.name || "Action"})`;

  return GuardedAction;
}

/**
 * Document actions resolver. Wraps workflow actions for articles
 * that have `legalReviewNeeded`. Non-article types pass through
 * unchanged.
 *
 * Must be applied AFTER the workflow plugin in the config so that
 * workflow actions are already in the `prev` array.
 */
export function legalReviewActions(
  prev: DocumentActionComponent[],
  context: { schemaType: string },
): DocumentActionComponent[] {
  // Only guard article actions
  if (context.schemaType !== "article") return prev;

  return prev.map((action) => createLegalGuardedAction(action));
}
