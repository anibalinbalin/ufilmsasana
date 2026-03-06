import { NextResponse } from "next/server";
import { isAuthenticated, generateState, getAuthUrl } from "@/lib/auth";

export async function GET() {
  if (await isAuthenticated()) {
    return NextResponse.json({ authenticated: true });
  }

  const state = generateState();
  const authUrl = getAuthUrl(state);
  return NextResponse.json({ authenticated: false, authUrl });
}
