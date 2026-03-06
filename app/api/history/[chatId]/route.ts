import { NextResponse } from "next/server";
import { getMessages } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;
  return NextResponse.json(getMessages(chatId));
}
