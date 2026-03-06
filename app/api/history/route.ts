import { NextResponse } from "next/server";
import { listChats, createChat, deleteChat } from "@/lib/db";

export async function GET() {
  return NextResponse.json(listChats());
}

export async function POST(req: Request) {
  const { id, title } = await req.json();
  createChat(id, title);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  deleteChat(id);
  return NextResponse.json({ ok: true });
}
