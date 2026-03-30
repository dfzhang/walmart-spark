import { streamText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createMCPClient } from "@ai-sdk/mcp";

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "o01w1nx2";
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN!;

const AGENT_CONTEXT_URL = `https://api.sanity.io/v2024-01-01/agent-context/${SANITY_PROJECT_ID}/${SANITY_DATASET}`;

const SYSTEM_PROMPT = `You are the Spark Driver™ Help Center assistant. You help Spark delivery drivers find answers to their questions about the Spark Driver app, earnings, deliveries, shopping orders, returns, troubleshooting, and account management.

RULES:
- ONLY answer questions using information from the Spark Driver Help Center content. Do NOT make up answers or use external knowledge.
- When you receive a question, use the available tools to search for relevant articles and categories in the help center.
- Start by using initial_context to understand the content structure, then use groq_query to find relevant articles.
- Always cite your sources by mentioning the article title and providing the article slug so the frontend can link to it.
- When citing an article, format it as: [Article Title](slug:article-slug-here)
- If you cannot find an answer in the help center content, say so honestly and suggest the driver contact support.
- Be concise, friendly, and professional. Drivers are busy — get to the point.
- Use bullet points and short paragraphs for readability.
- If a question is ambiguous, ask a clarifying question before searching.

GROQ TIPS:
- To search article text: *[_type == "article" && pt::text(body) match "search terms"]{title, slug, body, "categoryTitle": category->title}
- To get all categories: *[_type == "category"]{title, slug, description}
- To get articles in a category: *[_type == "article" && category._ref == ^._id]{title, slug}
- Use pt::text(body) to extract plain text from Portable Text fields for matching`;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const mcpClient = await createMCPClient({
    transport: {
      type: "sse",
      url: AGENT_CONTEXT_URL,
      headers: {
        Authorization: `Bearer ${SANITY_API_TOKEN}`,
      },
    },
  });

  const tools = await mcpClient.tools();

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: SYSTEM_PROMPT,
    messages,
    tools,
    stopWhen: stepCountIs(10),
    onFinish: async () => {
      await mcpClient.close();
    },
  });

  return result.toUIMessageStreamResponse();
}
