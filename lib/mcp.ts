import { createMCPClient } from "@ai-sdk/mcp";
import { getAccessToken } from "./auth";

let mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null = null;

export async function getAsanaMcpClient() {
  const token = await getAccessToken();

  // Recreate client if token changed (after refresh)
  if (mcpClient) {
    await mcpClient.close();
  }

  mcpClient = await createMCPClient({
    transport: {
      type: "http",
      url: "https://mcp.asana.com/v2/mcp",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  return mcpClient;
}

export async function closeMcpClient() {
  if (mcpClient) {
    await mcpClient.close();
    mcpClient = null;
  }
}
