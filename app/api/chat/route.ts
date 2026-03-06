import { google } from "@ai-sdk/google";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { getAsanaMcpClient, closeMcpClient } from "@/lib/mcp";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";
import { saveMessage, createChat, listChats } from "@/lib/db";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, chatId } = await req.json();

  // Save user message
  const lastMsg = messages[messages.length - 1];
  if (chatId && lastMsg?.role === "user") {
    const existingChats = listChats().map((c) => c.id);
    if (!existingChats.includes(chatId)) {
      const title =
        lastMsg.parts
          ?.find((p: { type: string }) => p.type === "text")
          ?.text?.slice(0, 50) || "Nuevo chat";
      createChat(chatId, title);
    }
    const content =
      lastMsg.parts
        ?.find((p: { type: string }) => p.type === "text")
        ?.text || "";
    saveMessage(lastMsg.id, chatId, "user", content);
  }

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
    onFinish: async ({ text }) => {
      if (chatId && text) {
        saveMessage(`assistant-${Date.now()}`, chatId, "assistant", text);
      }
      await closeMcpClient();
    },
    onError: async () => {
      await closeMcpClient();
    },
  });

  return result.toUIMessageStreamResponse();
}
