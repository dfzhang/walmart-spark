import type { MetadataRoute } from "next";
import { getAllArticleSlugs, getAllCategorySlugs } from "@/lib/sanity";
import { locales, localePath, type Locale } from "@/lib/i18n/config";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://sparkdriver.walmart.com/help";

/** Build absolute URL for a given locale + path. */
function localeUrl(locale: Locale, path: string): string {
  return `${BASE_URL}${localePath(locale, path)}`;
}

/**
 * Build a sitemap entry with hreflang alternates for all locales.
 * Google requires each locale variant to list ALL alternates (including itself).
 */
function localizedEntry(
  path: string,
  opts: {
    lastModified?: Date;
    changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority?: number;
  } = {}
): MetadataRoute.Sitemap[number] {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = localeUrl(locale, path);
  }
  languages["x-default"] = localeUrl("en", path);

  return {
    url: localeUrl("en", path),
    lastModified: opts.lastModified ?? new Date(),
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: { languages },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, categories] = await Promise.all([
    getAllArticleSlugs(),
    getAllCategorySlugs(),
  ]);

  const staticPages = [
    localizedEntry("/", {
      changeFrequency: "daily",
      priority: 1.0,
    }),
    localizedEntry("/search", {
      changeFrequency: "weekly",
      priority: 0.3,
    }),
    localizedEntry("/contact", {
      changeFrequency: "monthly",
      priority: 0.5,
    }),
  ];

  const articlePages = articles.map((a) =>
    localizedEntry(`/article/${a.slug}`, {
      lastModified: new Date(a._updatedAt),
      changeFrequency: "weekly",
      priority: 0.8,
    })
  );

  const categoryPages = categories.map((c) =>
    localizedEntry(`/category/${c.slug}`, {
      lastModified: new Date(c._updatedAt),
      changeFrequency: "weekly",
      priority: 0.6,
    })
  );

  return [...staticPages, ...categoryPages, ...articlePages];
}
