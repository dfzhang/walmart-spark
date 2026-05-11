import {
  defineLocations,
  type PresentationPluginOptions,
} from "sanity/presentation";

/**
 * Document location resolver for the Presentation Tool.
 *
 * Maps Sanity document types to their frontend routes so the Studio
 * can navigate the preview iframe to the correct page when an editor
 * selects a document. Includes both EN (root) and ES (/es/) routes
 * for i18n support.
 */
export const resolve: PresentationPluginOptions["resolve"] = {
  locations: {
    article: defineLocations({
      select: {
        title: "title",
        slug: "slug.current",
        language: "language",
      },
      resolve: (doc) => ({
        locations: [
          ...(doc?.slug
            ? [
                {
                  title: doc.title || "Untitled article",
                  href:
                    doc.language === "es"
                      ? `/es/article/${doc.slug}`
                      : `/article/${doc.slug}`,
                },
              ]
            : []),
          { title: "Home", href: "/" },
        ],
      }),
    }),

    category: defineLocations({
      select: {
        title: "title",
        slug: "slug.current",
        language: "language",
      },
      resolve: (doc) => ({
        locations: [
          ...(doc?.slug
            ? [
                {
                  title: doc.title || "Untitled category",
                  href:
                    doc.language === "es"
                      ? `/es/category/${doc.slug}`
                      : `/category/${doc.slug}`,
                },
              ]
            : []),
          { title: "Home", href: "/" },
        ],
      }),
    }),

    // Settings and banners affect the homepage
    helpCenterSettings: defineLocations({
      select: { title: "title" },
      resolve: () => ({
        locations: [{ title: "Home", href: "/" }],
      }),
    }),

    banner: defineLocations({
      select: { title: "title", language: "language" },
      resolve: (doc) => ({
        locations: [
          {
            title: doc?.title || "Banner",
            href: doc?.language === "es" ? "/es" : "/",
          },
        ],
      }),
    }),

    // FAQs appear on article pages that embed them — link to home as fallback
    faq: defineLocations({
      select: { title: "question" },
      resolve: (doc) => ({
        locations: [{ title: doc?.title || "FAQ", href: "/" }],
      }),
    }),

    faqCollection: defineLocations({
      select: { title: "title" },
      resolve: (doc) => ({
        locations: [{ title: doc?.title || "FAQ Collection", href: "/" }],
      }),
    }),

    // Animated assets appear embedded in articles — link to home as fallback
    animatedAsset: defineLocations({
      select: { title: "title" },
      resolve: (doc) => ({
        locations: [{ title: doc?.title || "Animated Asset", href: "/" }],
      }),
    }),
  },
};
