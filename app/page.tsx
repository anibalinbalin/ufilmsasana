"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useEffect, useState, useMemo, useCallback } from "react";

interface ChatSummary {
  id: string;
  title: string;
  created_at: string;
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function Chat() {
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState(() => generateId());
  const [history, setHistory] = useState<ChatSummary[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authState, setAuthState] = useState<{
    checked: boolean;
    authenticated: boolean;
    authUrl?: string;
  }>({ checked: false, authenticated: false });

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { chatId },
      }),
    [chatId]
  );
  const { messages, sendMessage, status, setMessages } = useChat({
    id: chatId,
    transport,
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((data) =>
        setAuthState({
          checked: true,
          authenticated: data.authenticated,
          authUrl: data.authUrl,
        })
      );
  }, []);

  const loadHistory = useCallback(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then(setHistory);
  }, []);

  useEffect(() => {
    if (authState.authenticated) loadHistory();
  }, [authState.authenticated, loadHistory]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const startNewChat = () => {
    const newId = generateId();
    setChatId(newId);
    setMessages([]);
    loadHistory();
  };

  const loadChat = async (id: string) => {
    const res = await fetch(`/api/history/${id}`);
    const stored = await res.json();
    setChatId(id);
    setMessages(
      stored.map(
        (m: { id: string; role: string; content: string }) => ({
          id: m.id,
          role: m.role,
          parts: [{ type: "text" as const, text: m.content }],
        })
      )
    );
    setSidebarOpen(false);
  };

  const deleteChat = async (id: string) => {
    await fetch("/api/history", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (id === chatId) startNewChat();
    loadHistory();
  };

  if (!authState.checked) {
    return (
      <div
        className="flex items-center justify-center h-screen text-neutral-500"
        aria-busy="true"
      >
        Cargando…
      </div>
    );
  }

  if (!authState.authenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-lg font-semibold">UFilms Asana</h1>
        <p className="text-neutral-500">
          Necesitas conectar tu cuenta de Asana
        </p>
        <a
          href={authState.authUrl}
          className="bg-blue-600 hover:bg-blue-500 rounded-xl px-6 py-2 text-sm font-medium"
        >
          Conectar con Asana
        </a>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Main chat */}
      <div className="flex flex-col flex-1 max-w-3xl mx-auto">
        <div className="flex items-center justify-between border-b border-neutral-800 p-3">
          <button
            onClick={startNewChat}
            className="text-xs text-neutral-400 hover:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
          >
            + Nuevo chat
          </button>
          <button
            onClick={() => {
              setSidebarOpen(!sidebarOpen);
              loadHistory();
            }}
            className="text-xs text-neutral-400 hover:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
          >
            Historial
          </button>
        </div>

        <div
          ref={scrollRef}
          role="log"
          aria-live="polite"
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  m.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-neutral-800 text-neutral-100"
                }`}
              >
                {m.parts.map((part, i) =>
                  part.type === "text" ? (
                    <p key={i} className="whitespace-pre-wrap text-sm">
                      {part.text}
                    </p>
                  ) : null
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start" aria-live="polite">
              <div className="bg-neutral-800 rounded-2xl px-4 py-2">
                <p className="text-sm text-neutral-400 animate-pulse">
                  Buscando en Asana…
                </p>
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) {
              sendMessage({ text: input });
              setInput("");
            }
          }}
          className="border-t border-neutral-800 p-4 flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder=""
            autoComplete="off"
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-950"
          >
            Enviar
          </button>
        </form>
      </div>

      {/* History sidebar */}
      {sidebarOpen && (
        <aside className="w-64 border-l border-neutral-800 bg-neutral-900 flex flex-col">
          <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
            <span className="text-sm font-medium">Historial</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-neutral-500 hover:text-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              Cerrar
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {history.length === 0 && (
              <p className="text-neutral-600 text-xs p-3">
                No hay chats guardados
              </p>
            )}
            {history.map((chat) => (
              <div
                key={chat.id}
                className={`flex items-center justify-between p-3 hover:bg-neutral-800 cursor-pointer border-b border-neutral-800/50 ${
                  chat.id === chatId ? "bg-neutral-800" : ""
                }`}
              >
                <button
                  onClick={() => loadChat(chat.id)}
                  className="flex-1 text-left text-xs text-neutral-300 truncate focus:outline-none"
                >
                  {chat.title}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                  className="text-neutral-600 hover:text-red-400 text-xs ml-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
