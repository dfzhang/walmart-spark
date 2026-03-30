import type { PortableTextBlock } from "@portabletext/types";

export interface SanitySlug {
  _type: "slug";
  current: string;
}

export interface SanityImage {
  _type: "image";
  asset: { _ref: string; _type: "reference" };
  alt?: string;
}

export interface Category {
  _id: string;
  title: string;
  slug: SanitySlug;
  description?: string;
  icon?: string;
  articleCount: number;
}

export interface ArticleSummary {
  _id: string;
  title: string;
  slug: SanitySlug;
  excerpt?: string;
  _updatedAt?: string;
}

export interface Article extends ArticleSummary {
  body: PortableTextBlock[];
  category?: { _id: string; title: string; slug: SanitySlug };
  relatedArticles?: ArticleSummary[];
}

export interface HelpCenterSettings {
  title?: string;
  description?: string;
  heroTitle?: string;
  heroSubtitle?: string;
}
