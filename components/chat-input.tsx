"use client";

import { useRef, useCallback, useEffect } from "react";

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 240) + "px";
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSubmit();
      }
    }
  };

  return (
    <div className="border-t border-neutral-800">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="relative flex items-end bg-neutral-900 border border-neutral-700 rounded-2xl focus-within:border-neutral-500">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            autoComplete="off"
            disabled={disabled}
            className="flex-1 bg-transparent resize-none px-4 py-3 pr-12 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled || !value.trim()}
            aria-label="Enviar mensaje"
            className="absolute right-2 bottom-2 size-8 flex items-center justify-center rounded-full bg-white text-black disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 12V4M8 4L4 8M8 4L12 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
