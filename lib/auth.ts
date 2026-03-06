import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import crypto from "crypto";

const TOKEN_FILE = join(process.cwd(), "data", "tokens.json");

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

function ensureDataDir() {
  const dir = join(process.cwd(), "data");
  if (!existsSync(dir)) {
    const { mkdirSync } = require("fs");
    mkdirSync(dir, { recursive: true });
  }
}

export function getStoredTokens(): TokenData | null {
  if (!existsSync(TOKEN_FILE)) return null;
  try {
    return JSON.parse(readFileSync(TOKEN_FILE, "utf-8"));
  } catch {
    return null;
  }
}

export function storeTokens(data: TokenData) {
  ensureDataDir();
  writeFileSync(TOKEN_FILE, JSON.stringify(data, null, 2));
}

export function generateState(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function getAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.ASANA_CLIENT_ID!,
    redirect_uri: `http://localhost:3000/api/auth/callback`,
    response_type: "code",
    state,
    scope: "default",
  });
  return `https://app.asana.com/-/oauth_authorize?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<TokenData> {
  const res = await fetch("https://app.asana.com/-/oauth_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.ASANA_CLIENT_ID!,
      client_secret: process.env.ASANA_CLIENT_SECRET!,
      redirect_uri: "http://localhost:3000/api/auth/callback",
      code,
    }).toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  const tokens: TokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000 - 300000, // 5min buffer
  };
  storeTokens(tokens);
  return tokens;
}

export async function getAccessToken(): Promise<string> {
  const tokens = getStoredTokens();
  if (!tokens) {
    throw new Error("NOT_AUTHENTICATED");
  }

  if (Date.now() < tokens.expires_at) {
    return tokens.access_token;
  }

  // Refresh
  const res = await fetch("https://app.asana.com/-/oauth_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.ASANA_CLIENT_ID!,
      client_secret: process.env.ASANA_CLIENT_SECRET!,
      refresh_token: tokens.refresh_token,
    }).toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  const newTokens: TokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || tokens.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000 - 300000,
  };
  storeTokens(newTokens);
  return newTokens.access_token;
}

export function isAuthenticated(): boolean {
  return getStoredTokens() !== null;
}
