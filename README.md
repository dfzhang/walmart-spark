# Spark Driver Help Center

A modern help center for Spark Driver™, built with Next.js 15, Sanity CMS, and Tailwind CSS v4.

## Getting Started

```bash
pnpm install
cp .env.local.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Next.js 15** — App Router, ISR, TypeScript
- **Sanity CMS** — Structured content (10 categories, 61 articles)
- **Tailwind CSS v4** — Utility-first styling
- **@portabletext/react** — Rich text rendering

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Homepage (categories + featured + search)
│   ├── category/[slug]/    # Category listing
│   ├── article/[slug]/     # Article detail
│   ├── search/             # Search results
│   ├── contact/            # Contact form
│   └── api/contact/        # Contact form API route
├── components/             # React components
└── lib/                    # Sanity client, queries, types
```
