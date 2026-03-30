/**
 * Convert FAQ articles from flat Q&A blocks → structured faqSection blocks.
 *
 * Detects articles with CSS-contaminated excerpts (accordion/faq-question patterns)
 * and restructures their body:
 * - Strips leaked CSS/JS text blocks from the body
 * - Groups question (ends with ?) + answer blocks into faqSection items
 * - Preserves h3 section headings as regular blocks between faqSections
 * - Regenerates excerpt from first answer text
 */

import { createClient } from "@sanity/client";
import crypto from "crypto";

const client = createClient({
  projectId: "o01w1nx2",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

function key() {
  return crypto.randomBytes(6).toString("hex");
}

function getBlockText(block) {
  if (block._type !== "block" || !block.children) return "";
  return block.children.map((c) => c.text || "").join("").trim();
}

function isLeakedCssOrJs(text) {
  return (
    text.includes(".accordion") ||
    text.includes(".faq-") ||
    text.includes("background-color:") ||
    text.includes("font-family:") ||
    text.includes("document.getElementsByClassName") ||
    text.includes("$(function()") ||
    text.includes("var acc =") ||
    text.includes("max-width:") ||
    text.includes("border-radius:") ||
    (text.includes("{") && text.includes("}") && text.includes(":") && text.includes(";") && text.length > 50)
  );
}

function isSectionHeading(block) {
  return block._type === "block" && block.style && block.style.startsWith("h");
}

function isQuestion(block) {
  if (block._type !== "block") return false;
  const text = getBlockText(block);
  return text.endsWith("?") && block.style === "normal";
}

function buildFaqSection(qaGroups) {
  return {
    _type: "faqSection",
    _key: key(),
    items: qaGroups.map((group) => ({
      _type: "faqItem",
      _key: key(),
      question: getBlockText(group.question),
      answer: group.answerBlocks.map((block) => ({
        ...block,
        _key: key(),
        children: block.children?.map((c) => ({ ...c, _key: key() })),
      })),
    })),
  };
}

async function main() {
  // Find articles with CSS in excerpt (the affected FAQ articles)
  const articles = await client.fetch(
    `*[_type == "article" && (
      excerpt match "accordion" || 
      excerpt match "faq-container" ||
      excerpt match "font-family"
    )]{_id, title, slug, body, excerpt}`
  );

  console.log(`Found ${articles.length} FAQ articles to convert\n`);

  const transaction = client.transaction();
  let converted = 0;

  for (const article of articles) {
    const body = article.body;
    if (!body || !Array.isArray(body)) continue;

    console.log(`\n=== ${article.title} (${body.length} blocks) ===`);

    // Phase 1: Strip leaked CSS/JS blocks
    const cleanBlocks = body.filter((block) => {
      if (block._type !== "block") return true;
      const text = getBlockText(block);
      if (isLeakedCssOrJs(text)) {
        console.log(`  ✂ Stripped CSS/JS: ${text.substring(0, 60)}...`);
        return false;
      }
      // Strip empty h3 blocks (artifact of accordion HTML)
      if (block.style === "h3" && text === "") {
        console.log(`  ✂ Stripped empty h3`);
        return false;
      }
      return true;
    });

    // Phase 2: Group into sections
    // Walk through blocks, collecting:
    // - Regular blocks (headings, intro text) → keep as-is
    // - Question + answer groups → collect into faqSection
    const newBody = [];
    let currentQAGroups = [];
    let currentAnswerBlocks = [];
    let currentQuestion = null;

    function flushQA() {
      if (currentQuestion) {
        currentQAGroups.push({
          question: currentQuestion,
          answerBlocks: currentAnswerBlocks,
        });
        currentQuestion = null;
        currentAnswerBlocks = [];
      }
    }

    function flushFaqSection() {
      flushQA();
      if (currentQAGroups.length > 0) {
        const section = buildFaqSection(currentQAGroups);
        newBody.push(section);
        console.log(`  📋 FAQ section: ${currentQAGroups.length} Q&A pairs`);
        currentQAGroups = [];
      }
    }

    for (const block of cleanBlocks) {
      if (isQuestion(block)) {
        // If we had a previous question, save it
        flushQA();
        currentQuestion = block;
      } else if (currentQuestion) {
        // We're collecting answer blocks for the current question
        if (isSectionHeading(block)) {
          // Section heading breaks the FAQ flow
          flushFaqSection();
          newBody.push(block);
          console.log(`  📌 Kept heading: ${getBlockText(block)}`);
        } else {
          currentAnswerBlocks.push(block);
        }
      } else if (isSectionHeading(block) && !currentQuestion) {
        // Heading before any questions - flush any pending FAQ, keep heading
        flushFaqSection();
        newBody.push(block);
        console.log(`  📌 Kept heading: ${getBlockText(block)}`);
      } else {
        // Non-question block before any Q&A starts, or between sections
        // Could be intro text - keep as regular block
        flushFaqSection();
        newBody.push(block);
      }
    }

    // Flush any remaining Q&A
    flushFaqSection();

    // Phase 3: Generate clean excerpt from first Q&A
    const firstFaqSection = newBody.find((b) => b._type === "faqSection");
    let newExcerpt = "";
    if (firstFaqSection && firstFaqSection.items?.length > 0) {
      const firstQ = firstFaqSection.items[0].question;
      const firstA = firstFaqSection.items[0].answer
        ?.map((b) =>
          b.children?.map((c) => c.text || "").join("") || ""
        )
        .join(" ")
        .trim();
      newExcerpt = `${firstQ} ${firstA}`.substring(0, 200);
    }

    const faqCount = newBody.filter((b) => b._type === "faqSection").length;
    const totalQA = newBody
      .filter((b) => b._type === "faqSection")
      .reduce((sum, s) => sum + (s.items?.length || 0), 0);

    console.log(
      `  Result: ${newBody.length} blocks (${faqCount} faqSection(s), ${totalQA} Q&A pairs)`
    );
    console.log(`  New excerpt: ${newExcerpt.substring(0, 80)}...`);

    const patch = { body: newBody };
    if (newExcerpt) {
      patch.excerpt = newExcerpt;
    }

    transaction.patch(article._id, { set: patch });
    converted++;
  }

  if (converted === 0) {
    console.log("\nNothing to convert.");
    return;
  }

  console.log(`\nCommitting ${converted} articles...`);

  try {
    await transaction.commit();
    console.log(`\n✅ Done! Converted ${converted} FAQ articles.`);
  } catch (err) {
    console.error("❌ Transaction failed:", err.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
