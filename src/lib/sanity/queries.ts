import { client } from "./client";

// Category queries
export const allCategoriesQuery = `*[_type == "category"] | order(orderRank asc) {
  _id, title, slug, description, icon,
  "articleCount": count(*[_type == "article" && references(^._id)])
}`;

export const categoryBySlugQuery = `*[_type == "category" && slug.current == $slug][0] {
  _id, title, slug, description, icon, seo,
  "articles": *[_type == "article" && references(^._id)] | order(orderRank asc) {
    _id, title, slug, excerpt, _updatedAt
  }
}`;

// Article queries
export const articleBySlugQuery = `*[_type == "article" && slug.current == $slug][0] {
  _id, title, slug, body, excerpt, _updatedAt, seo,
  "category": category->{_id, title, slug},
  "relatedArticles": relatedArticles[]->{_id, title, slug, excerpt}
}`;

export const featuredArticlesQuery = `*[_type == "article" && featured == true] | order(orderRank asc) [0...6] {
  _id, title, slug, excerpt,
  "category": category->{title, slug}
}`;

export const searchArticlesQuery = `*[_type == "article" && (
  title match $query + "*" ||
  excerpt match $query + "*" ||
  pt::text(body) match $query + "*"
)] [0...20] {
  _id, title, slug, excerpt,
  "category": category->{title, slug}
}`;

// Sitemap queries
export const allArticleSlugsQuery = `*[_type == "article"] | order(_updatedAt desc) {
  "slug": slug.current, _updatedAt
}`;

export const allCategorySlugsQuery = `*[_type == "category"] | order(_updatedAt desc) {
  "slug": slug.current, _updatedAt
}`;

// Settings
export const helpCenterSettingsQuery = `*[_type == "helpCenterSettings"][0] {
  title, description, heroTitle, heroSubtitle
}`;

// Fetchers
export async function getAllCategories() {
  return client.fetch(allCategoriesQuery);
}

export async function getCategoryBySlug(slug: string) {
  return client.fetch(categoryBySlugQuery, { slug });
}

export async function getArticleBySlug(slug: string) {
  return client.fetch(articleBySlugQuery, { slug });
}

export async function getFeaturedArticles() {
  return client.fetch(featuredArticlesQuery);
}

export async function searchArticles(query: string) {
  return client.fetch(searchArticlesQuery, { query } as Record<string, string>);
}

export async function getHelpCenterSettings() {
  return client.fetch(helpCenterSettingsQuery);
}

export async function getAllArticleSlugs() {
  return client.fetch(allArticleSlugsQuery) as Promise<
    { slug: string; _updatedAt: string }[]
  >;
}

export async function getAllCategorySlugs() {
  return client.fetch(allCategorySlugsQuery) as Promise<
    { slug: string; _updatedAt: string }[]
  >;
}
