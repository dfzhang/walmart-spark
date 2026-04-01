/**
 * Disables drag-and-drop on the workflow Kanban board.
 *
 * The workflow plugin uses @hello-pangea/dnd for drag-and-drop.
 * Our legalReviewGuard only controls document action buttons,
 * not Kanban drag. Rather than patching the plugin, we disable
 * drag entirely via CSS — pointer-events: none on drag handles
 * and cursor reset on draggable elements.
 *
 * This is a cosmetic fix: editors use the document action buttons
 * (which are fully guarded) to transition workflow states.
 */
import { definePlugin, type LayoutProps } from "sanity";
import { useEffect } from "react";

const STYLE_ID = "disable-workflow-drag";

const CSS = `
/* Disable drag handles in workflow Kanban */
[data-rfd-drag-handle-draggable-id] {
  pointer-events: none !important;
  cursor: default !important;
}

/* Remove grab cursor from draggable cards */
[data-rfd-draggable-id] {
  cursor: default !important;
}
`;

/**
 * React component that injects the style tag into <head>.
 * Cleans up on unmount.
 */
function InjectDisableDragStyles() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, []);

  return null;
}

function DisableDragLayout(props: LayoutProps) {
  return (
    <>
      <InjectDisableDragStyles />
      {props.renderDefault(props)}
    </>
  );
}

export const disableWorkflowDrag = definePlugin({
  name: "disable-workflow-drag",
  studio: {
    components: {
      layout: DisableDragLayout,
    },
  },
});
