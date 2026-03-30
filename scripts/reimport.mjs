/**
 * Re-imports article bodies from HelpDocs into Sanity as Portable Text.
 * Patches existing documents (preserves category refs, featured flags, etc.)
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
 * Parse inline HTML into spans with marks and markDefs.
 * Handles: <strong>, <b>, <em>, <i>, <a href>, nested combinations.
 */
function parseInline(html) {
  const spans = [];
  const markDefs = [];

  // Tokenize into text and tags
  const tokens = html.split(/(<\/?(?:strong|b|em|i|a|u|code|br)[^>]*>)/gi);
  let activeMarks = [];
  let activeLinkKey = null;

  for (const token of tokens) {
    if (!token) continue;

    const tagMatch = token.match(/^<(\/?)(strong|b|em|i|a|u|code|br)([^>]*)>$/i);
    if (!tagMatch) {
      // Text node — decode HTML entities
      const text = token
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ");
      if (text) {
        spans.push(makeSpan(text, [...activeMarks]));
      }
      continue;
    }

    const [, closing, tag] = tagMatch;
    const tagLower = tag.toLowerCase();

    if (tagLower === "br") {
      spans.push(makeSpan("\n", [...activeMarks]));
      continue;
    }

    if (closing === "/") {
      // Closing tag
      if (tagLower === "a") {
        activeMarks = activeMarks.filter((m) => m !== activeLinkKey);
        activeLinkKey = null;
      } else {
        const mark = tagLower === "b" ? "strong" : tagLower === "i" ? "em" : tagLower;
        activeMarks = activeMarks.filter((m) => m !== mark);
      }
    } else {
      // Opening tag
      if (tagLower === "a") {
        const hrefM = tagMatch[3].match(/href="([^"]*)"/);
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
 * Convert HTML string to Portable Text blocks.
 * Handles: h1-h6, p, ul/ol/li (nested), strong, em, a, br, div.note
 */
function htmlToPortableText(html) {
  if (!html || !html.trim()) {
    return [makeBlock("normal", [makeSpan("(No content)")])];
  }

  const blocks = [];
  blockKey = 0;

  // Normalize whitespace between tags
  let cleaned = html
    .replace(/\r\n/g, "\n")
    .replace(/>\s+</g, "> <")
    .trim();

  // Split into block-level elements
  // Match opening and closing block tags, plus everything between
  const blockRegex = /<(h[1-6]|p|li|div|ul|ol|blockquote|table|tr|td|th)(\s[^>]*)?>|<\/(h[1-6]|p|li|div|ul|ol|blockquote|table|tr|td|th)>/gi;

  let lastIndex = 0;
  let listStack = []; // track nested ul/ol
  const segments = [];

  // First pass: extract block-level segments
  let match;
  const tagPositions = [];
  while ((match = blockRegex.exec(cleaned)) !== null) {
    tagPositions.push({
      index: match.index,
      length: match[0].length,
      tag: (match[1] || match[3]).toLowerCase(),
      isClosing: match[0].startsWith("</"),
      attrs: match[2] || "",
      raw: match[0],
    });
  }

  // Second pass: pair opening/closing tags and extract content
  function extractBlocks(html) {
    const result = [];

    // Simple state machine approach
    // Split by block-level tags
    const parts = html.split(
      /(<\/?(?:h[1-6]|p|li|ul|ol|div|blockquote|table|thead|tbody|tr|td|th|hr)(?:\s[^>]*)?>)/gi
    );

    let currentStyle = "normal";
    let currentContent = "";
    let inList = false;
    let listType = "bullet";
    let listLevel = 0;
    let skipDiv = 0;

    function flush() {
      const trimmed = currentContent.trim();
      if (!trimmed) {
        currentContent = "";
        return;
      }

      // Strip wrapping tags that might have leaked through
      const stripped = trimmed.replace(/^<div[^>]*>|<\/div>$/gi, "").trim();
      if (!stripped) {
        currentContent = "";
        return;
      }

      const { spans, markDefs } = parseInline(stripped);
      const block = makeBlock(currentStyle, spans, {
        markDefs,
        ...(inList ? { listItem: listType, level: listLevel } : {}),
      });
      result.push(block);
      currentContent = "";
    }

    for (const part of parts) {
      if (!part) continue;

      const tagMatch = part.match(
        /^<(\/?)(h[1-6]|p|li|ul|ol|div|blockquote|table|thead|tbody|tr|td|th|hr)(\s[^>]*)?>$/i
      );

      if (!tagMatch) {
        // Content
        currentContent += part;
        continue;
      }

      const [, closing, tag, attrs = ""] = tagMatch;
      const t = tag.toLowerCase();

      if (t === "hr") {
        flush();
        // Skip hr
        continue;
      }

      if (closing === "/") {
        // Closing tag
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
            if (skipDiv > 0) skipDiv--;
            flush();
            break;
          case "table": case "thead": case "tbody": case "tr": case "td": case "th":
            // Tables: just flush content as paragraphs
            flush();
            break;
          case "blockquote":
            flush();
            currentStyle = "normal";
            break;
        }
      } else {
        // Opening tag
        switch (t) {
          case "h1": case "h2": case "h3": case "h4": case "h5": case "h6":
            flush();
            currentStyle = t;
            break;
          case "p":
            flush();
            currentStyle = inList ? "normal" : "normal";
            break;
          case "li":
            flush();
            currentStyle = "normal";
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
            // Check for TOC div — skip it
            if (/id="toc"/i.test(attrs)) {
              skipDiv++;
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
    return result;
  }

  const result = extractBlocks(cleaned);

  // Filter out empty blocks and TOC blocks
  const filtered = result.filter((b) => {
    if (b._type !== "block") return true;
    const text = b.children.map((c) => c.text).join("").trim();
    return text.length > 0;
  });

  return filtered.length > 0
    ? filtered
    : [makeBlock("normal", [makeSpan("(No content)")])];
}

// --- Main ---

console.log("🔍 Fetching homepage...");
const homepage = await fetchHTML(BASE);

// Extract article links
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

let success = 0;
let failed = 0;

for (let i = 0; i < articleLinks.length; i++) {
  const link = articleLinks[i];
  try {
    const html = await fetchHTML(`${BASE}${link.path}`);

    // Extract body HTML
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

    // Convert to Portable Text
    const body = htmlToPortableText(bodyHtml);

    // Validate: ensure all blocks have required fields
    for (const block of body) {
      if (block._type === "block") {
        if (!block.children || block.children.length === 0) {
          block.children = [makeSpan("")];
        }
        if (!block.markDefs) block.markDefs = [];
        if (!block.style) block.style = "normal";
      }
    }

    // Patch the existing document (preserve category, featured, etc.)
    await client
      .patch(`article-${link.slug}`)
      .set({ body })
      .commit();

    const blockCount = body.length;
    const textLen = body
      .filter((b) => b._type === "block")
      .reduce((sum, b) => sum + b.children.reduce((s, c) => s + (c.text?.length || 0), 0), 0);

    console.log(
      `  ✅ [${i + 1}/${articleLinks.length}] ${link.slug} — ${blockCount} blocks, ${textLen} chars`
    );
    success++;

    await new Promise((r) => setTimeout(r, 100));
  } catch (err) {
    console.error(`  ❌ [${i + 1}] ${link.slug}: ${err.message}`);
    failed++;
  }
}

console.log(`\n✅ Done! ${success} updated, ${failed} failed.`);
