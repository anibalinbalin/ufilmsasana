import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "asana_tokens";
const ENCRYPTION_KEY = process.env.ASANA_CLIENT_SECRET!.padEnd(32, "0").slice(0, 32);

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text: string): string {
  const [ivHex, encrypted] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export async function getStoredTokens(): Promise<TokenData | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie) return null;
  try {
    return JSON.parse(decrypt(cookie.value));
  } catch {
    return null;
  }
}

export async function storeTokens(data: TokenData) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, encrypt(JSON.stringify(data)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year (refresh token lasts long)
  });
}

function getRedirectUri(): string {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/api/auth/callback`;
  }
  return "http://localhost:3000/api/auth/callback";
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
  await storeTokens(tokens);
  return tokens;
}

export async function getAccessToken(): Promise<string> {
  const tokens = await getStoredTokens();
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
  await storeTokens(newTokens);
  return newTokens.access_token;
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getStoredTokens()) !== null;
}
