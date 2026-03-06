import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@ai-sdk/mcp", "better-sqlite3"],
};

export default nextConfig;
