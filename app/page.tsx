"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useEffect, useState, useMemo } from "react";

export default function Chat() {
  const [input, setInput] = useState("");
  const [authState, setAuthState] = useState<{
    checked: boolean;
    authenticated: boolean;
    authUrl?: string;
  }>({ checked: false, authenticated: false });

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    []
  );
  const { messages, sendMessage, status } = useChat({ transport });
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

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

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
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
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
  );
}
