import { google } from "@ai-sdk/google";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { getAsanaMcpClient, closeMcpClient } from "@/lib/mcp";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();

  let mcpClient;
  try {
    mcpClient = await getAsanaMcpClient();
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "NOT_AUTHENTICATED") {
      return new Response("Not authenticated with Asana", { status: 401 });
    }
    return new Response(`MCP error: ${message}`, { status: 500 });
  }

  const tools = await mcpClient.tools();

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(10),
    onFinish: async () => {
      await closeMcpClient();
    },
    onError: async () => {
      await closeMcpClient();
    },
  });

  return result.toUIMessageStreamResponse();
}
