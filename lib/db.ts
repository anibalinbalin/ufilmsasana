import Database from "better-sqlite3";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

const DATA_DIR = join(process.cwd(), "data");
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(join(DATA_DIR, "chat.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export interface ChatSummary {
  id: string;
  title: string;
  created_at: string;
}

export function listChats(): ChatSummary[] {
  return db
    .prepare("SELECT id, title, created_at FROM chats ORDER BY created_at DESC")
    .all() as ChatSummary[];
}

export function createChat(id: string, title: string) {
  db.prepare("INSERT INTO chats (id, title) VALUES (?, ?)").run(id, title);
}

export function deleteChat(id: string) {
  db.prepare("DELETE FROM chats WHERE id = ?").run(id);
}

export interface StoredMessage {
  id: string;
  chat_id: string;
  role: string;
  content: string;
  created_at: string;
}

export function getMessages(chatId: string): StoredMessage[] {
  return db
    .prepare(
      "SELECT id, chat_id, role, content, created_at FROM messages WHERE chat_id = ? ORDER BY created_at ASC"
    )
    .all(chatId) as StoredMessage[];
}

export function saveMessage(
  id: string,
  chatId: string,
  role: string,
  content: string
) {
  db.prepare(
    "INSERT OR REPLACE INTO messages (id, chat_id, role, content) VALUES (?, ?, ?, ?)"
  ).run(id, chatId, role, content);
}

export function updateChatTitle(id: string, title: string) {
  db.prepare("UPDATE chats SET title = ? WHERE id = ?").run(title, id);
}
