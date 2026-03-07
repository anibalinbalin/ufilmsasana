"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useMemo, useEffect } from "react";
import { ChatMessages } from "@/components/chat-messages";
import { ChatInput } from "@/components/chat-input";

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

  if (!authState.checked) {
    return (
      <div
        className="flex items-center justify-center h-dvh text-neutral-500"
        aria-busy="true"
      >
        Cargando…
      </div>
    );
  }

  if (!authState.authenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh gap-4">
        <h1 className="text-lg font-semibold text-balance">UFilms Asana</h1>
        <p className="text-neutral-500 text-pretty">
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
    <div className="flex flex-col h-dvh">
      <ChatMessages messages={messages} isLoading={isLoading} />
      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={() => {
          if (input.trim()) {
            sendMessage({ text: input });
            setInput("");
          }
        }}
        disabled={isLoading}
      />
    </div>
  );
}
