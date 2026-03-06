import { join } from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

// On Vercel (serverless), we use a simple JSON file in /tmp
// Locally, we use /data directory
const IS_VERCEL = !!process.env.VERCEL;
const DATA_DIR = IS_VERCEL ? "/tmp" : join(process.cwd(), "data");
const DB_FILE = join(DATA_DIR, "chats.json");

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

interface ChatData {
  chats: ChatSummary[];
  messages: StoredMessage[];
}

function readDb(): ChatData {
  if (!existsSync(DB_FILE)) return { chats: [], messages: [] };
  try {
    return JSON.parse(readFileSync(DB_FILE, "utf-8"));
  } catch {
    return { chats: [], messages: [] };
  }
}

function writeDb(data: ChatData) {
  writeFileSync(DB_FILE, JSON.stringify(data));
}

export interface ChatSummary {
  id: string;
  title: string;
  created_at: string;
}

export function listChats(): ChatSummary[] {
  return readDb().chats.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function createChat(id: string, title: string) {
  const db = readDb();
  if (db.chats.find((c) => c.id === id)) return;
  db.chats.push({ id, title, created_at: new Date().toISOString() });
  writeDb(db);
}

export function deleteChat(id: string) {
  const db = readDb();
  db.chats = db.chats.filter((c) => c.id !== id);
  db.messages = db.messages.filter((m) => m.chat_id !== id);
  writeDb(db);
}

export interface StoredMessage {
  id: string;
  chat_id: string;
  role: string;
  content: string;
  created_at: string;
}

export function getMessages(chatId: string): StoredMessage[] {
  return readDb()
    .messages.filter((m) => m.chat_id === chatId)
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
}

export function saveMessage(
  id: string,
  chatId: string,
  role: string,
  content: string
) {
  const db = readDb();
  const existing = db.messages.findIndex((m) => m.id === id);
  const msg: StoredMessage = {
    id,
    chat_id: chatId,
    role,
    content,
    created_at: new Date().toISOString(),
  };
  if (existing >= 0) {
    db.messages[existing] = msg;
  } else {
    db.messages.push(msg);
  }
  writeDb(db);
}

export function updateChatTitle(id: string, title: string) {
  const db = readDb();
  const chat = db.chats.find((c) => c.id === id);
  if (chat) chat.title = title;
  writeDb(db);
}
