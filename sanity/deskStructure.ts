import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";
import type { StructureBuilder } from "sanity/structure";
import type { ConfigContext, Template } from "sanity";
import { i18n } from "../sanity.config";

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
        filter: `_type == "category" && (!defined(language) || language == "en")`,
      }),

      S.divider(),

      // ── Articles (drag-and-drop ordering) ────────────────────
      orderableDocumentListDeskItem({
        type: "article",
        title: "All Articles",
        icon: () => "📄",
        S,
        context,
        filter: `_type == "article" && (!defined(language) || language == "en")`,
      }),

      // ── Articles by Category ─────────────────────────────────
      S.listItem()
        .title("Articles by Category")
        .icon(() => "🗂️")
        .child(
          S.documentTypeList("category")
            .title("Pick a Category")
            .filter(`_type == "category" && (!defined(language) || language == "en")`)
            .child((categoryId) =>
              S.documentList()
                .title("Articles")
                .filter(
                  '_type == "article" && category._ref == $categoryId && (!defined(language) || language == "en")'
                )
                .params({ categoryId })
                .defaultOrdering([{ field: "orderRank", direction: "asc" }])
            )
        ),

      S.divider(),

      // ── Translations by Language ─────────────────────────────
      S.listItem()
        .title("Translations")
        .icon(() => "🌐")
        .child(
          S.list()
            .title("Browse by Language")
            .items(
              i18n.languages.map((lang) =>
                S.listItem()
                  .title(lang.title)
                  .icon(() => (lang.id === "en" ? "🇺🇸" : "🇲🇽"))
                  .child(
                    S.list()
                      .title(`${lang.title} Content`)
                      .items([
                        S.listItem()
                          .title("Articles")
                          .icon(() => "📄")
                          .child(
                            S.documentList()
                              .title(`Articles (${lang.title})`)
                              .filter(
                                `_type == "article" && language == $language`
                              )
                              .params({ language: lang.id })
                          ),
                        S.listItem()
                          .title("Categories")
                          .icon(() => "📂")
                          .child(
                            S.documentList()
                              .title(`Categories (${lang.title})`)
                              .filter(
                                `_type == "category" && language == $language`
                              )
                              .params({ language: lang.id })
                          ),
                        S.listItem()
                          .title("FAQ Collections")
                          .icon(() => "📋")
                          .child(
                            S.documentList()
                              .title(`FAQ Collections (${lang.title})`)
                              .filter(
                                `_type == "faqCollection" && language == $language`
                              )
                              .params({ language: lang.id })
                          ),
                        S.listItem()
                          .title("FAQs")
                          .icon(() => "❓")
                          .child(
                            S.documentList()
                              .title(`FAQs (${lang.title})`)
                              .filter(
                                `_type == "faq" && language == $language`
                              )
                              .params({ language: lang.id })
                          ),
                        S.listItem()
                          .title("Banners")
                          .icon(() => "📢")
                          .child(
                            S.documentList()
                              .title(`Banners (${lang.title})`)
                              .filter(
                                `_type == "banner" && language == $language`
                              )
                              .params({ language: lang.id })
                          ),
                      ])
                  )
              )
            )
        ),

      // ── Needs Legal Review ─────────────────────────────────
      S.listItem()
        .title("Needs Legal Review")
        .icon(() => "⚖️")
        .child(
          S.documentList()
            .title("Articles Requiring Legal Review")
            .filter(
              `_type == "article" && legalReviewNeeded == true && (!defined(language) || language == "en")`
            )
            .defaultOrdering([{ field: "_updatedAt", direction: "desc" }])
        ),

      S.divider(),

      // ── FAQ Collections ──────────────────────────────────────
      S.listItem()
        .title("FAQ Collections")
        .icon(() => "📋")
        .child(
          S.documentTypeList("faqCollection")
            .title("FAQ Collections")
            .filter(`_type == "faqCollection" && (!defined(language) || language == "en")`)
        ),

      // ── All FAQs ─────────────────────────────────────────────
      S.listItem()
        .title("All FAQs")
        .icon(() => "❓")
        .child(
          S.documentTypeList("faq")
            .title("All FAQs")
            .filter(`_type == "faq" && (!defined(language) || language == "en")`)
        ),

      S.divider(),

      // ── Notification Banners ────────────────────────────────
      S.listItem()
        .title("Notification Banners")
        .icon(() => "📢")
        .child(
          S.documentTypeList("banner")
            .title("Notification Banners")
            .filter(`_type == "banner" && (!defined(language) || language == "en")`)
        ),

      S.divider(),

      // ── Style Guide ─────────────────────────────────────────
      S.listItem()
        .title("📖 Style Guide")
        .icon(() => "📖")
        .child(
          S.documentTypeList("glossaryTerm")
            .title("Style Guide — Banned Terms")
            .defaultOrdering([
              { field: "severity", direction: "asc" },
              { field: "bannedTerm", direction: "asc" },
            ])
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

// Filter out singleton + translation metadata from "new document" options
export const newDocumentOptions = (prev: Template[]) =>
  prev.filter(
    (template) =>
      template.id !== "helpCenterSettings" &&
      template.id !== "translation.metadata"
  );
