/**
 * Scrapes Spark Driver Help Center from HelpDocs and imports to Sanity.
 * Usage: SANITY_API_TOKEN=xxx node scripts/scrape-and-import.mjs
 */
import { createClient } from "@sanity/client";

const BASE = "https://sparkdriverapp-walmart.helpdocs.io";
const client = createClient({
  projectId: "o01w1nx2",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

async function fetchHTML(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "SparkHelpCenterMigration/1.0" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

// HTML to Portable Text converter
function htmlToPortableText(html) {
  const blocks = [];
  const parts = html.split(/(<\/?(?:h[1-6]|p|ul|ol|li|div|br)[^>]*>)/gi);
  let currentText = "";
  let inList = false;
  let listType = "bullet";
  let listLevel = 0;

  function flushText(style = "normal") {
    const text = currentText.replace(/<[^>]+>/g, "").trim();
    if (!text) { currentText = ""; return; }

    const spans = parseInlineMarks(currentText);
    blocks.push({
      _type: "block",
      _key: `b${blocks.length}`,
      style,
      children: spans,
      ...(inList ? { listItem: listType, level: listLevel || 1 } : {}),
    });
    currentText = "";
  }

  function parseInlineMarks(html) {
    const spans = [];
    const markDefs = [];
    let text = html;
    const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let linkMatch;
    const links = [];
    while ((linkMatch = linkRegex.exec(text)) !== null) {
      links.push({ full: linkMatch[0], href: linkMatch[1], text: linkMatch[2] });
    }

    // Simple approach: strip tags, create single span
    const clean = text.replace(/<[^>]+>/g, "").trim();
    if (!clean) return [{ _type: "span", _key: "s0", text: "", marks: [] }];

    // Check for bold/italic
    const marks = [];
    if (/<(strong|b)>/i.test(text)) marks.push("strong");
    if (/<(em|i)>/i.test(text)) marks.push("em");

    if (links.length > 0) {
      // Handle links
      let remaining = text;
      let spanIdx = 0;
      for (const link of links) {
        const idx = remaining.indexOf(link.full);
        if (idx > 0) {
          const before = remaining.slice(0, idx).replace(/<[^>]+>/g, "").trim();
          if (before) {
            spans.push({ _type: "span", _key: `s${spanIdx++}`, text: before, marks: [] });
          }
        }
        const linkKey = `link${markDefs.length}`;
        markDefs.push({ _type: "link", _key: linkKey, href: link.href });
        spans.push({
          _type: "span",
          _key: `s${spanIdx++}`,
          text: link.text.replace(/<[^>]+>/g, ""),
          marks: [linkKey],
        });
        remaining = remaining.slice(remaining.indexOf(link.full) + link.full.length);
      }
      const after = remaining.replace(/<[^>]+>/g, "").trim();
      if (after) {
        spans.push({ _type: "span", _key: `s${spanIdx++}`, text: after, marks: [] });
      }
    } else {
      spans.push({ _type: "span", _key: "s0", text: clean, marks });
    }

    if (markDefs.length > 0) {
      // Attach markDefs to parent block (handled in flushText)
    }

    return spans;
  }

  for (const part of parts) {
    const tagMatch = part.match(/^<(\/?)(h[1-6]|p|ul|ol|li|div|br)([^>]*)>/i);
    if (!tagMatch) {
      currentText += part;
      continue;
    }

    const [, closing, tag, attrs] = tagMatch;
    const tagLower = tag.toLowerCase();

    if (tagLower === "br") {
      currentText += "\n";
      continue;
    }

    if (closing === "/") {
      // Closing tag
      if (/^h[1-6]$/.test(tagLower)) {
        flushText(tagLower);
      } else if (tagLower === "p") {
        flushText("normal");
      } else if (tagLower === "li") {
        flushText("normal");
      } else if (tagLower === "ul" || tagLower === "ol") {
        inList = false;
        listLevel = Math.max(0, listLevel - 1);
      }
    } else {
      // Opening tag
      if (tagLower === "ul") { inList = true; listType = "bullet"; listLevel++; }
      else if (tagLower === "ol") { inList = true; listType = "number"; listLevel++; }
      else if (tagLower === "div" && /note|callout|alert/i.test(attrs)) {
        flushText();
        // Will be handled as callout
      }
    }
  }
  flushText();

  return blocks.length > 0 ? blocks : [{ _type: "block", _key: "b0", style: "normal", children: [{ _type: "span", _key: "s0", text: html.replace(/<[^>]+>/g, "").trim() || "", marks: [] }] }];
}

console.log("🔍 Fetching homepage...");
const homepage = await fetchHTML(BASE);

// Extract categories
const catTitleRegex = /id="category-([a-z0-9]+)-title"[\s\S]*?>\s*([^<]+)\s*<\/p>/g;
const categories = [];
let m;
while ((m = catTitleRegex.exec(homepage)) !== null) {
  categories.push({ id: m[1], title: m[2].trim() });
}
for (const cat of categories) {
  const slugM = homepage.match(new RegExp(`/l/en/category/${cat.id}-([^"]+)"`));
  cat.slug = slugM ? slugM[1] : cat.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
console.log(`📂 ${categories.length} categories`);

// Map articles to categories
const artToCat = new Map();
for (let i = 0; i < categories.length; i++) {
  const cat = categories[i];
  const startIdx = homepage.indexOf(`category-${cat.id}-items`);
  if (startIdx === -1) continue;
  let endIdx = homepage.length;
  if (i + 1 < categories.length) {
    const nextIdx = homepage.indexOf(`category-${categories[i + 1].id}-title`, startIdx);
    if (nextIdx !== -1) endIdx = nextIdx;
  }
  const section = homepage.slice(startIdx, endIdx);
  const artIds = [...new Set([...section.matchAll(/\/l\/en\/article\/([a-z0-9]+)-/g)].map(m => m[1]))];
  for (const id of artIds) artToCat.set(id, cat.id);
}

// Extract article links
const artRegex = /href="(\/l\/en\/article\/([a-z0-9]+)-([^"]+))"/g;
const seen = new Set();
const articleLinks = [];
while ((m = artRegex.exec(homepage)) !== null) {
  if (seen.has(m[2])) continue;
  seen.add(m[2]);
  articleLinks.push({ path: m[1], id: m[2], slug: m[3] });
}
console.log(`📄 ${articleLinks.length} articles`);

// Import categories to Sanity
console.log("\n📤 Importing categories...");
for (let i = 0; i < categories.length; i++) {
  const cat = categories[i];
  await client.createOrReplace({
    _id: `category-${cat.slug}`,
    _type: "category",
    title: cat.title,
    slug: { _type: "slug", current: cat.slug },
    orderRank: String(i).padStart(3, "0"),
  });
  console.log(`  ✅ ${cat.title}`);
}

// Scrape and import articles
console.log("\n📥 Scraping & importing articles...");
for (let i = 0; i < articleLinks.length; i++) {
  const link = articleLinks[i];
  try {
    const html = await fetchHTML(`${BASE}${link.path}`);
    const titleM = html.match(/<h1 class="card-title">([^<]+)<\/h1>/);
    const title = titleM ? titleM[1].trim() : link.slug.replace(/-/g, " ");

    let body = "";
    const cbM = html.match(/<div class="card-block">([\s\S]*?)(?:<div class="row">|<\/article>|<footer)/);
    if (cbM) {
      body = cbM[1].replace(/<h1[^>]*>[\s\S]*?<\/h1>/, "").replace(/<p class="card-text meta">[\s\S]*?<\/p>/, "").trim();
    }

    const excerpt = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
    const portableText = htmlToPortableText(body);

    const catId = artToCat.get(link.id);
    const cat = categories.find(c => c.id === catId);

    await client.createOrReplace({
      _id: `article-${link.slug}`,
      _type: "article",
      title,
      slug: { _type: "slug", current: link.slug },
      body: portableText,
      excerpt,
      ...(cat ? { category: { _type: "reference", _ref: `category-${cat.slug}` } } : {}),
      featured: i < 3,
      orderRank: String(i).padStart(3, "0"),
    });

    console.log(`  ✅ [${i + 1}/${articleLinks.length}] ${title.slice(0, 60)}`);
    await new Promise(r => setTimeout(r, 100));
  } catch (err) {
    console.error(`  ❌ ${link.slug}: ${err.message}`);
  }
}

// Create settings singleton
await client.createOrReplace({
  _id: "helpCenterSettings",
  _type: "helpCenterSettings",
  title: "Spark Driver™ Help Center",
  heroTitle: "How can we help?",
  heroSubtitle: "Search our help center or browse categories below",
});

console.log("\n✅ Import complete!");
