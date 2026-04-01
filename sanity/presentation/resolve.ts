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
  },
};
