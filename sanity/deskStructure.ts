import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";
import type { StructureBuilder } from "sanity/structure";
import type { ConfigContext, Template } from "sanity";

export const structure = (S: StructureBuilder, context: ConfigContext) =>
  S.list()
    .title("Help Center")
    .items([
      // ── Categories (drag-and-drop ordering) ──────────────────
      orderableDocumentListDeskItem({
        type: "category",
        title: "Categories",
        icon: () => "📂",
        S,
        context,
      }),

      S.divider(),

      // ── Articles (drag-and-drop ordering) ────────────────────
      orderableDocumentListDeskItem({
        type: "article",
        title: "All Articles",
        icon: () => "📄",
        S,
        context,
      }),

      // ── Articles by Category ─────────────────────────────────
      S.listItem()
        .title("Articles by Category")
        .icon(() => "🗂️")
        .child(
          S.documentTypeList("category")
            .title("Pick a Category")
            .child((categoryId) =>
              S.documentList()
                .title("Articles")
                .filter(
                  '_type == "article" && category._ref == $categoryId'
                )
                .params({ categoryId })
                .defaultOrdering([{ field: "orderRank", direction: "asc" }])
            )
        ),

      S.divider(),

      // ── Settings (singleton) ─────────────────────────────────
      S.listItem()
        .title("Settings")
        .icon(() => "⚙️")
        .child(
          S.document()
            .schemaType("helpCenterSettings")
            .documentId("helpCenterSettings")
        ),

      S.divider(),

      // ── Agent Context (AI chatbot config) ────────────────────
      S.documentTypeListItem("sanity.agentContext")
        .title("Agent Context"),
    ]);

// Filter out singleton from "new document" options
export const newDocumentOptions = (prev: Template[]) =>
  prev.filter(
    (template) => template.id !== "helpCenterSettings"
  );
