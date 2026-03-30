import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createMCPClient } from "@ai-sdk/mcp";

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "o01w1nx2";
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN!;
const AGENT_CONTEXT_SLUG = process.env.SANITY_AGENT_CONTEXT_SLUG || "";

const AGENT_CONTEXT_URL = `https://api.sanity.io/v2024-01-01/agent-context/${SANITY_PROJECT_ID}/${SANITY_DATASET}${AGENT_CONTEXT_SLUG ? `/${AGENT_CONTEXT_SLUG}` : ""}`;

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
  if (!SANITY_API_TOKEN) {
    return new Response(
      JSON.stringify({ error: "SANITY_API_TOKEN is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let mcpClient: Awaited<ReturnType<typeof createMCPClient>> | undefined;
  try {
    const { messages } = await req.json();

    // useChat sends UIMessage format (parts array), but streamText
    // expects ModelMessage format (content string). Convert.
    const modelMessages = await convertToModelMessages(messages);

    mcpClient = await createMCPClient({
      transport: {
        type: "http",
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
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(10),
      onFinish: async () => {
        await mcpClient?.close();
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    await mcpClient?.close();
    const message = error instanceof Error ? error.message : String(error);
    console.error("[chat] Error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
