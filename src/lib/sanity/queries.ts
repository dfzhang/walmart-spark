import { sanityFetch } from "./live";
import { client } from "./client";
import type { Locale } from "@/lib/i18n/config";

/**
 * Language filter for GROQ queries.
 * Matches documents with the given language, OR documents with no language
 * set (legacy English content created before i18n was enabled).
 */
function langFilter(locale: Locale): string {
  return `(language == "${locale}" || (!defined(language) && "${locale}" == "en"))`;
}

// ── Banner ────────────────────────────────────────────────────

export const activeBannerQuery = (locale: Locale) =>
  `*[_type == "banner" && isActive == true && ${langFilter(locale)}] | order(_updatedAt desc) [0] {
  _id, message, severity
}`;

// ── Categories ────────────────────────────────────────────────

export const allCategoriesQuery = (locale: Locale) =>
  `*[_type == "category" && ${langFilter(locale)}] | order(orderRank asc) {
  _id, title, slug, description, icon,
  "articleCount": count(*[_type == "article" && references(^._id) && ${langFilter(locale)}])
}`;

export const categoryBySlugQuery = (locale: Locale) =>
  `*[_type == "category" && slug.current == $slug && ${langFilter(locale)}][0] {
  _id, title, slug, description, icon, seo,
  "articles": *[_type == "article" && references(^._id) && ${langFilter(locale)}] | order(orderRank asc) {
    _id, title, slug, excerpt, _updatedAt
  }
}`;

// ── Articles ──────────────────────────────────────────────────

export const articleBySlugQuery = (locale: Locale) =>
  `*[_type == "article" && slug.current == $slug && ${langFilter(locale)}][0] {
  _id, title, slug, body, excerpt, _updatedAt, seo,
  "category": category->{_id, title, slug},
  "relatedArticles": relatedArticles[]->{_id, title, slug, excerpt}
}`;

export const featuredArticlesQuery = (locale: Locale) =>
  `*[_type == "article" && featured == true && ${langFilter(locale)}] | order(orderRank asc) [0...6] {
  _id, title, slug, excerpt,
  "category": category->{title, slug}
}`;

export const searchArticlesQuery = (locale: Locale) =>
  `*[_type == "article" && ${langFilter(locale)} && (
  title match $query + "*" ||
  excerpt match $query + "*" ||
  pt::text(body) match $query + "*"
)] [0...20] {
  _id, title, slug, excerpt,
  "category": category->{title, slug}
}`;

// ── Settings ──────────────────────────────────────────────────

export const helpCenterSettingsQuery = (locale: Locale) =>
  `*[_type == "helpCenterSettings" && ${langFilter(locale)}][0] {
  title, description, heroTitle, heroSubtitle
}`;

// ── Sitemap (language-agnostic — needs ALL locales) ───────────

export const allArticleSlugsQuery = `*[_type == "article"] | order(_updatedAt desc) {
  "slug": slug.current, _updatedAt
}`;

export const allCategorySlugsQuery = `*[_type == "category"] | order(_updatedAt desc) {
  "slug": slug.current, _updatedAt
}`;

// ── Fetchers (live-aware via sanityFetch) ─────────────────────

export async function getActiveBanner(locale: Locale = "en") {
  const { data } = await sanityFetch({
    query: activeBannerQuery(locale),
  });
  return data as {
    _id: string;
    message: string;
    severity: "announcement" | "warning" | "critical";
  } | null;
}

export async function getAllCategories(locale: Locale = "en") {
  const { data } = await sanityFetch({
    query: allCategoriesQuery(locale),
  });
  return data;
}

export async function getCategoryBySlug(slug: string, locale: Locale = "en") {
  const { data } = await sanityFetch({
    query: categoryBySlugQuery(locale),
    params: { slug },
  });
  return data;
}

export async function getArticleBySlug(slug: string, locale: Locale = "en") {
  const { data } = await sanityFetch({
    query: articleBySlugQuery(locale),
    params: { slug },
  });
  return data;
}

export async function getFeaturedArticles(locale: Locale = "en") {
  const { data } = await sanityFetch({
    query: featuredArticlesQuery(locale),
  });
  return data;
}

export async function searchArticles(query: string, locale: Locale = "en") {
  // sanityFetch infers params from const query strings — dynamic GROQ
  // builders return plain `string`, so we cast to satisfy the type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (sanityFetch as any)({
    query: searchArticlesQuery(locale),
    params: { query },
  });
  return data;
}

export async function getHelpCenterSettings(locale: Locale = "en") {
  const { data } = await sanityFetch({
    query: helpCenterSettingsQuery(locale),
  });
  return data;
}

// ── Metadata helpers (no stega — prevents invisible chars in SEO) ──

export async function getArticleBySlugForMetadata(slug: string, locale: Locale = "en") {
  const { data } = await sanityFetch({
    query: articleBySlugQuery(locale),
    params: { slug },
    stega: false,
  });
  return data;
}

export async function getCategoryBySlugForMetadata(slug: string, locale: Locale = "en") {
  const { data } = await sanityFetch({
    query: categoryBySlugQuery(locale),
    params: { slug },
    stega: false,
  });
  return data;
}

// ── Static generation helpers (published perspective, no stega) ──

export async function getAllArticleSlugs() {
  const { data } = await sanityFetch({
    query: allArticleSlugsQuery,
    perspective: "published",
    stega: false,
  });
  return data as { slug: string; _updatedAt: string }[];
}

export async function getAllCategorySlugs() {
  const { data } = await sanityFetch({
    query: allCategorySlugsQuery,
    perspective: "published",
    stega: false,
  });
  return data as { slug: string; _updatedAt: string }[];
}
