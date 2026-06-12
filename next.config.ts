import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  serverExternalPackages: ["@ai-sdk/mcp"],
};

export default nextConfig;
