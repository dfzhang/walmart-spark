export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://sparkdriver.walmart.com/help";

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

/** Build a locale-aware path. English = root, Spanish = /es prefix. */
export function localePath(locale: Locale, path: string): string {
  if (locale === "en") return path;
  return `/${locale}${path}`;
}

/**
 * Build hreflang alternates for Next.js Metadata.
 * Returns { "en": absoluteEnUrl, "es": absoluteEsUrl, "x-default": absoluteEnUrl }
 */
export function buildHreflangAlternates(path: string): Record<string, string> {
  // path should be the locale-agnostic path, e.g. "/article/foo" or "/"
  const enUrl = `${BASE_URL}${path === "/" ? "" : path}`;
  const esUrl = `${BASE_URL}/es${path === "/" ? "" : path}`;
  return {
    en: enUrl,
    es: esUrl,
    "x-default": enUrl,
  };
}
