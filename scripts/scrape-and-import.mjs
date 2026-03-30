/**
 * Re-imports article bodies from HelpDocs into Sanity as clean Portable Text.
 * Strips scripts, styles, figures, and other non-content HTML before converting.
 * Usage: node scripts/reimport.mjs
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

let blockKey = 0;
function key() { return `k${blockKey++}`; }

function makeSpan(text, marks = []) {
  return { _type: "span", _key: key(), text: text || "", marks };
}

function makeBlock(style, children, extra = {}) {
  return {
    _type: "block",
    _key: key(),
    style: style || "normal",
    markDefs: extra.markDefs || [],
    children: children.length > 0 ? children : [makeSpan("")],
    ...(extra.listItem ? { listItem: extra.listItem, level: extra.level || 1 } : {}),
  };
}

/**
 * Clean HTML before parsing: remove scripts, styles, meta, figures, hr, etc.
 */
function cleanHTML(html) {
  return html
    // Remove entire script blocks (including content)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    // Remove entire style blocks
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    // Remove meta tags
    .replace(/<meta[^>]*\/?>/gi, "")
    // Remove title tags (embedded in some articles)
    .replace(/<title[\s\S]*?<\/title>/gi, "")
    // Remove hr tags
    .replace(/<hr[^>]*\/?>/gi, "")
    // Remove figure/figcaption (images — we skip these for now)
    .replace(/<figure[\s\S]*?<\/figure>/gi, "[image]")
    // Remove standalone img tags
    .replace(/<img[^>]*\/?>/gi, "[image]")
    // Remove noscript
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, "")
    // Unwrap span tags (keep content, drop the tag)
    .replace(/<\/?span[^>]*>/gi, "")
    // Unwrap sup/sub (keep content)
    .replace(/<\/?su[bp][^>]*>/gi, "")
    // Convert details/summary to plain content
    .replace(/<\/?details[^>]*>/gi, "")
    .replace(/<\/?summary[^>]*>/gi, "")
    // Remove data attributes and class attributes from remaining tags
    .replace(/ (?:class|data-[a-z-]+|style|id|role|aria-[a-z-]+)="[^"]*"/gi, "")
    // Collapse whitespace
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim();
}

/**
 * Decode HTML entities
 */
function decodeEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&lsquo;/g, "\u2018")
    .replace(/&rdquo;/g, "\u201D")
    .replace(/&ldquo;/g, "\u201C")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&hellip;/g, "\u2026")
    .replace(/&trade;/g, "\u2122")
    .replace(/&copy;/g, "\u00A9")
    .replace(/&reg;/g, "\u00AE");
}

/**
 * Parse inline HTML into spans with marks and markDefs.
 * Only handles: <strong>, <b>, <em>, <i>, <a href>, <u>, <code>, <br>
 * Everything else should be stripped by cleanHTML first.
 */
function parseInline(html) {
  const spans = [];
  const markDefs = [];

  // Tokenize: split on known inline tags only
  const tokens = html.split(/(<\/?(?:strong|b|em|i|a|u|code|br)[^>]*>)/gi);
  let activeMarks = [];
  let activeLinkKey = null;

  for (const token of tokens) {
    if (!token) continue;

    const tagMatch = token.match(/^<(\/?)(strong|b|em|i|a|u|code|br)([^>]*)>$/i);
    if (!tagMatch) {
      // Text node
      const text = decodeEntities(token);
      // Strip any remaining HTML tags that leaked through
      const clean = text.replace(/<[^>]+>/g, "");
      if (clean) {
        spans.push(makeSpan(clean, [...activeMarks]));
      }
      continue;
    }

    const [, closing, tag, attrs] = tagMatch;
    const tagLower = tag.toLowerCase();

    if (tagLower === "br") {
      spans.push(makeSpan("\n", [...activeMarks]));
      continue;
    }

    if (closing === "/") {
      if (tagLower === "a") {
        activeMarks = activeMarks.filter((m) => m !== activeLinkKey);
        activeLinkKey = null;
      } else {
        const mark = tagLower === "b" ? "strong" : tagLower === "i" ? "em" : tagLower;
        activeMarks = activeMarks.filter((m) => m !== mark);
      }
    } else {
      if (tagLower === "a") {
        const hrefM = attrs.match(/href="([^"]*)"/);
        if (hrefM) {
          const linkKey = key();
          markDefs.push({ _type: "link", _key: linkKey, href: hrefM[1] });
          activeLinkKey = linkKey;
          activeMarks.push(linkKey);
        }
      } else {
        const mark = tagLower === "b" ? "strong" : tagLower === "i" ? "em" : tagLower;
        activeMarks.push(mark);
      }
    }
  }

  return { spans: spans.length > 0 ? spans : [makeSpan("")], markDefs };
}

/**
 * Convert cleaned HTML to Portable Text blocks.
 */
function htmlToPortableText(html) {
  if (!html || !html.trim()) {
    return [makeBlock("normal", [makeSpan("(No content)")])];
  }

  const blocks = [];
  blockKey = 0;

  // Split by block-level tags
  const parts = html.split(
    /(<\/?(?:h[1-6]|p|li|ul|ol|div|blockquote|table|thead|tbody|tr|td|th)[^>]*>)/gi
  );

  let currentStyle = "normal";
  let currentContent = "";
  let inList = false;
  let listType = "bullet";
  let listLevel = 0;
  let divDepth = 0;
  let skipToc = false;

  function flush() {
    const trimmed = currentContent.trim();
    currentContent = "";
    if (!trimmed) return;

    // Strip any remaining div wrappers
    const stripped = trimmed.replace(/^<div[^>]*>|<\/div>$/gi, "").trim();
    if (!stripped) return;

    // Final safety: strip any remaining unknown tags from content
    // but preserve the text between them
    const safeContent = stripped;

    const { spans, markDefs } = parseInline(safeContent);

    // Check if all spans are empty
    const totalText = spans.reduce((s, sp) => s + (sp.text || ""), "");
    if (!totalText.trim()) return;

    blocks.push(
      makeBlock(currentStyle, spans, {
        markDefs,
        ...(inList ? { listItem: listType, level: listLevel } : {}),
      })
    );
  }

  for (const part of parts) {
    if (!part) continue;

    const tagMatch = part.match(
      /^<(\/?)(h[1-6]|p|li|ul|ol|div|blockquote|table|thead|tbody|tr|td|th)([^>]*)>$/i
    );

    if (!tagMatch) {
      if (!skipToc) {
        currentContent += part;
      }
      continue;
    }

    const [, closing, tag, attrs = ""] = tagMatch;
    const t = tag.toLowerCase();

    if (closing === "/") {
      switch (t) {
        case "h1": case "h2": case "h3": case "h4": case "h5": case "h6":
          flush();
          currentStyle = "normal";
          break;
        case "p":
          flush();
          break;
        case "li":
          flush();
          break;
        case "ul":
        case "ol":
          listLevel = Math.max(0, listLevel - 1);
          if (listLevel === 0) inList = false;
          break;
        case "div":
          divDepth = Math.max(0, divDepth - 1);
          if (skipToc && divDepth === 0) skipToc = false;
          flush();
          break;
        case "blockquote":
          flush();
          currentStyle = "normal";
          break;
        case "table": case "thead": case "tbody": case "tr": case "td": case "th":
          flush();
          break;
      }
    } else {
      switch (t) {
        case "h1": case "h2": case "h3": case "h4": case "h5": case "h6":
          flush();
          currentStyle = t;
          break;
        case "p":
          flush();
          break;
        case "li":
          flush();
          break;
        case "ul":
          flush();
          listLevel++;
          inList = true;
          listType = "bullet";
          break;
        case "ol":
          flush();
          listLevel++;
          inList = true;
          listType = "number";
          break;
        case "div":
          flush();
          divDepth++;
          // Skip TOC divs
          if (/id="toc"|id="htmlWithToc"/i.test(attrs)) {
            // Don't skip — the TOC wrapper contains the actual content too
            // Only skip the inner toc div
          }
          if (/\bid="toc"\b/i.test(attrs)) {
            skipToc = true;
          }
          break;
        case "blockquote":
          flush();
          currentStyle = "blockquote";
          break;
        case "table": case "thead": case "tbody": case "tr": case "td": case "th":
          flush();
          break;
      }
    }
  }

  flush();

  // Filter out [image] placeholder blocks and truly empty blocks
  const filtered = blocks.filter((b) => {
    if (b._type !== "block") return true;
    const text = b.children.map((c) => c.text || "").join("").trim();
    return text.length > 0 && text !== "[image]";
  });

  return filtered.length > 0
    ? filtered
    : [makeBlock("normal", [makeSpan("(No content)")])];
}

// --- Main ---

console.log("🔍 Fetching homepage...");
const homepage = await fetchHTML(BASE);

const artRegex = /href="(\/l\/en\/article\/([a-z0-9]+)-([^"]+))"/g;
const seen = new Set();
const articleLinks = [];
let m;
while ((m = artRegex.exec(homepage)) !== null) {
  if (seen.has(m[2])) continue;
  seen.add(m[2]);
  articleLinks.push({ path: m[1], id: m[2], slug: m[3] });
}
console.log(`📄 ${articleLinks.length} articles to update\n`);

let success = 0, failed = 0;

for (let i = 0; i < articleLinks.length; i++) {
  const link = articleLinks[i];
  try {
    const html = await fetchHTML(`${BASE}${link.path}`);

    const cbM = html.match(
      /<div class="card-block">([\s\S]*?)(?:<div class="row">|<\/article>|<footer)/
    );
    if (!cbM) {
      console.error(`  ⚠️ [${i + 1}] ${link.slug}: no card-block found`);
      failed++;
      continue;
    }

    let bodyHtml = cbM[1]
      .replace(/<h1[^>]*>[\s\S]*?<\/h1>/, "")
      .replace(/<p class="card-text meta">[\s\S]*?<\/p>/, "")
      .trim();

    // CLEAN the HTML before converting
    bodyHtml = cleanHTML(bodyHtml);

    const body = htmlToPortableText(bodyHtml);

    // Validate blocks
    for (const block of body) {
      if (block._type === "block") {
        if (!block.children || block.children.length === 0) {
          block.children = [makeSpan("")];
        }
        if (!block.markDefs) block.markDefs = [];
        if (!block.style) block.style = "normal";
      }
    }

    // Verify no HTML tags leaked into span text
    let leaked = false;
    for (const block of body) {
      if (block._type === "block") {
        for (const child of block.children) {
          if (child.text && /<[a-z\/][^>]*>/i.test(child.text)) {
            leaked = true;
            // Strip them as last resort
            child.text = child.text.replace(/<[^>]+>/g, "");
          }
        }
      }
    }

    await client.patch(`article-${link.slug}`).set({ body }).commit();

    const blockCount = body.length;
    const textLen = body
      .filter((b) => b._type === "block")
      .reduce((sum, b) => sum + b.children.reduce((s, c) => s + (c.text?.length || 0), 0), 0);

    console.log(
      `  ✅ [${i + 1}/${articleLinks.length}] ${link.slug} — ${blockCount} blocks, ${textLen} chars${leaked ? " (stripped leaked tags)" : ""}`
    );
    success++;

    await new Promise((r) => setTimeout(r, 100));
  } catch (err) {
    console.error(`  ❌ [${i + 1}] ${link.slug}: ${err.message}`);
    failed++;
  }
}

console.log(`\n✅ Done! ${success} updated, ${failed} failed.`);
