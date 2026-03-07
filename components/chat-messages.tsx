"use client";

import { useRef, useEffect } from "react";
import { Message } from "./message";
import type { UIMessage } from "ai";

export function ChatMessages({
  messages,
  isLoading,
}: {
  messages: UIMessage[];
  isLoading: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      role="log"
      aria-live="polite"
      className="flex-1 overflow-y-auto"
    >
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {messages.map((m) => (
          <Message key={m.id} message={m} />
        ))}
        {isLoading && (
          <div aria-live="polite">
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-neutral-500 animate-pulse" />
              <span
                className="size-1.5 rounded-full bg-neutral-500 animate-pulse"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="size-1.5 rounded-full bg-neutral-500 animate-pulse"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
