import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import crypto from "crypto";

const IS_VERCEL = !!process.env.VERCEL;
const DATA_DIR = IS_VERCEL ? "/tmp" : join(process.cwd(), "data");
const TOKEN_FILE = join(DATA_DIR, "tokens.json");

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

function getRedirectUri(): string {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/api/auth/callback`;
  }
  return "http://localhost:3000/api/auth/callback";
}

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
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
  writeFileSync(TOKEN_FILE, JSON.stringify(data, null, 2));
}

export function generateState(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function getAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.ASANA_CLIENT_ID!,
    redirect_uri: getRedirectUri(),
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
      redirect_uri: getRedirectUri(),
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
    expires_at: Date.now() + data.expires_in * 1000 - 300000,
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
